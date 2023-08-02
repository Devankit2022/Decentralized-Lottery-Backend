const { network, getNamedAccounts, ethers } = require("hardhat")
const { developementChains } = require("../../helper-hardhat.config")
const { expect, assert } = require("chai")

developementChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", function () {
          let raffle, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("Works with a live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          try {
                              await expect(raffle.getPlayer(0)).to.be.reverted

                              const recentWinner = await raffle.getRecentWinner()
                              assert.equal(recentWinner.toString(), accounts[0].address)

                              const raffleState = await raffle.getRaffleState()
                              assert.equal(raffleState.toString(), "0")

                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              assert(endingTimeStamp > startingTimeStamp)

                              const winnerEndingBalance = await ethers.provider.getBalance(
                                  accounts[0].address,
                              )
                              assert.equal(
                                  winnerEndingBalance,
                                  winnerStartingBalance + raffleEntranceFee,
                              )
                              resolve()
                          } catch (e) {
                              console.error(e)
                              reject(e)
                          }
                      })
                      const tx = await raffle.enterRaffle({
                          value: raffleEntranceFee,
                      })
                      await tx.wait(1)
                      const winnerStartingBalance = await ethers.provider.getBalance(
                          accounts[0].address,
                      )
                      //   while (Number(await raffle.getNumberOfPlayers()) !== 0) {
                      //       continue
                      //   }
                      //   raffle.emit("WinnerPicked", accounts[0].address)
                  })
              })
          })
      })
