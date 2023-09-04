
# Decentralized Lottery Backend

Here is the complete backend code for the decentralized lottery app. The app uses a smart contract which is deployed on the Sepolia chain and uses the tools of Chainlink to function.

# Getting Started

## Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - You'll know you did it right if you can run `git --version` and get an ouput like `git version x.x.x`
- [Nodejs](https://nodejs.org/en/)
  - You'll know you've installed nodejs right if you can run `node --version` and get an ouput like: `vx.x.x`
- [Yarn](https://yarnpkg.com/getting-started/install)
  - You'll know you've installed yarn right if you can run `yarn --version` and get an output like: `x.x.x`
  - You might need to install it with [npm](https://classic.yarnpkg.com/lang/en/docs/install/) if you are facing any issues.


## Quickstart

```
git clone https://github.com/Devankit2022/Decentralized-Lottery-Backend.git
cd hardhat-fund-me-fcc
yarn
```

# Usage

### Deploy

```
yarn hardhat deploy
```

### Test

```
yarn hardhat test
```

### Test Coverage
```
yarn hardhat coverage
```
## Deployment to a testnet

#### Setup environment variables

You'll want to set your `SEPOLIA_RPC_URL` and `PRIVATE_KEY` as environment variables. You can add them to a `.env` file.

- `PRIVATE_KEY`: The private key of your account (like from [metamask](https://metamask.io/)).

- `SEPOLIA_RPC_URL`: This is url of the seplia testnet node you're working with. You can get setup with one for free from [Alchemy](https://alchemy.com/?a=673c802981)

#### Get testnet ETH

Head over to [SEPOLIA FAUCET](https://sepoliafaucet.com/) and get some tesnet ETH. You should see the ETH show up in your metamask.

#### Deploy

```
yarn hardhat deploy --network sepolia
```
## Setting Up Chainlink VRF and Chainlink Keepers

#### Setup a Chainlink VRF Subscription ID

Head over to [vrf.chain.link](https://vrf.chain.link/) and setup a new subscription, and get a subscriptionId. You can reuse an old subscription if you already have one. You can follow the [documentation](https://docs.chain.link/vrf/v2/introduction/) if you get lost.

In your `helper-hardhat-config.js` add your `subscriptionId` under the section of the chainId you're using ( add your `subscriptionId` in the `subscriptionId` field under the `11155111` section )

#### Add your contract address as a Chainlink VRF Consumer

Go back to [vrf.chain.link](https://vrf.chain.link) and under your subscription add `Add consumer` and add your `contract address`. You should also fund the contract with a minimum of 2 LINKS. 

#### Register a Chainlink Keepers Upkeep

Go to [keepers.chain.link](https://keepers.chain.link/new) and register a new upkeep. Choose `Custom logic` as your trigger mechanism for automation.

You can follow the [documentation](https://docs.chain.link/chainlink-automation/introduction/) if you get lost.


## Scripts

You're contract is now setup to be a tamper proof autonomous verifiably random lottery. Enter the lottery by running:

```
yarn hardhat run scripts/enter.js --network sepolia
```

### Estimate gas

You can estimate how much gas things cost by running the test command, and you'll see and output file called `gas-report.txt`

```
yarn hardhat test
```
#### Estimate gas cost in USD

To get a USD estimation of gas cost, you'll need a `COINMARKETCAP_API_KEY` environment variable. You can get one for free from [CoinMarketCap](https://pro.coinmarketcap.com/signup).

### Verify on etherscan

If you deploy to a testnet or mainnet, you can verify it if you get an [API Key](https://etherscan.io/myapikey) from Etherscan and set it as an environemnt variable named `ETHERSCAN_API_KEY`

In it's current state, if you have your api key set, it will auto verify using

```
yarn hardhat deploy
```

### Linting

[solhint](https://protofire.github.io/solhint/#installation) installation.

To check linting / code formatting:
```
yarn lint
```
or, to fix: 
```
yarn lint:fix
```

### Formatting 

```
yarn format
```

# Thank You
