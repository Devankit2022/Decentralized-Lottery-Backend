const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developementChains, networkConfig } = require("../../helper-hardhat.config")
const { assert, expect } = require("chai")

!developementChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])

              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })
          describe("constructor", function () {
              it("Initializes the raffle correctly", async function () {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
          describe("Enter Raffle", function () {
              it("Reverts when you don't pay enough", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle_NotEnoughETHEntered",
                  )
              })
              it("Records players when they enter", async function () {
                  await raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("Emits event on enter", async function () {
                  await expect(
                      raffle.enterRaffle({
                          value: raffleEntranceFee,
                      }),
                  ).to.emit(raffle, "RaffleEnter")
              })
              it("Doesn't allow entrance when raffle is calculating", async function () {
                  await raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep(Uint8Array.from([]))
                  await expect(
                      raffle.enterRaffle({
                          value: raffleEntranceFee,
                      }),
                  ).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen")
              })
          })
          describe("checkUpKeep", function () {
              it("Returns false if people haven't sent any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(Uint8Array.from([]))
                  assert(!upkeepNeeded)
              })
              it("Returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep(Uint8Array.from([]))
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(Uint8Array.from([]))
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("Returns false if enough time hasn't passed", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) - 5])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(Uint8Array.from([]))
                  assert(!upkeepNeeded)
              })
              it("Returns true if enough time has passed, has players, eth, and is open", async function () {
                  await raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(Uint8Array.from([]))
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", function () {
              it("It can only run if checkUpkeep is true", async function () {
                  raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const tx = await raffle.performUpkeep(Uint8Array.from([]))
                  assert(tx)
              })
              it("Reverts when checkUpkeep is false", async function () {
                  await expect(raffle.performUpkeep(Uint8Array.from([])))
                      .to.be.revertedWithCustomError(raffle, "Raffle__UpkeepNotNeeded")
                      .withArgs(0, 0, 0)
              })
              it("Updates the raffle state, emits an event, and calls the vrfCoordinator", async function () {
                  raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
                  const txResponse = await raffle.performUpkeep(Uint8Array.from([]))
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.logs[1].args[0]
                  const raffleState = await raffle.getRaffleState()
                  assert(Number(requestId) > 0)
                  assert.equal(raffleState.toString(), "1")
              })
          })
          describe("fulfillRandomWords", function () {
              beforeEach(async function () {
                  await raffle.enterRaffle({
                      value: raffleEntranceFee,
                  })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.send("evm_mine", [])
              })
              it("Can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, await raffle.getAddress()),
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, await raffle.getAddress()),
                  ).to.be.revertedWith("nonexistent request")
              })
              it("Picks a winner, resets the lottery, and sends money", async function () {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({
                          value: raffleEntranceFee,
                      })
                  }
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  await new Promise(async (resolve, reject) => {
                      let winnerStartingBalance
                      raffle.once("WinnerPicked", async () => {
                          //   console.log("WinnerPicked event fired!")
                          try {
                              //   const recentWinner = await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()
                              const winnerEndingBalance = await ethers.provider.getBalance(
                                  accounts[1].address,
                              )
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerEndingBalance,
                                  raffleEntranceFee * BigInt(additionalEntrants + 1) +
                                      winnerStartingBalance,
                              )
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      try {
                          const txResponse = await raffle.performUpkeep(Uint8Array.from([]))
                          const txReceipt = await txResponse.wait(1)
                          winnerStartingBalance = await ethers.provider.getBalance(
                              accounts[1].address,
                          )
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.logs[1].args[0],
                              await raffle.getAddress(),
                          )
                          //   raffle.emit("WinnerPicked", accounts[1].address)
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })
