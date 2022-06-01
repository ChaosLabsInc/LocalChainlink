![Chaos Labs - Chainlink Collaboration](https://github.com/ChaosLabsInc/chainlink-on-terra/blob/main/img/ChaosChainlink.jpeg)

This repository hosts a tool for deploying Chainlink price feeds into the LocalTerra ecosystem along with a CLI utility for mocking Chainlink Oracle prices Chainlink Data Feeds within LocalTerra.

Navigate to our Quickstart section to get the repo up and running.

For a full deep dive to the project architecture please visit the Chaos Labs blog.

## Why is Mocking Oracle values useful in testing?
Oracle return values trigger internal state changes in web3 applications. When working on local development environment, once feeds are deployed, the return values are constant. This is because the Chainlink protocol only writes updated values to mainnet or public testnets. Chaos Labs aims to streamline developer productivity while also making it easier to test applications, This tool gives developers the ability to mock return values easily. Now we can test how our contracts / applications react to different types of external data 🤗. Below, we provide some specific use cases for mocking oracle return values.


## Use Cases
DeFi protocols and applications are at high risk due to volatile market conditions and a myriad of security vectors. Mocking Chainlink Oracle return values in a controlled, siloed testing environment allows us to address 2 common vectors.

### Volatile Market Conditions

Volatility is a DeFi constant and is something that all protocols and applications should test for thoroughly. Internal application and protocol state is often a direct result of Oracle returns values. To further illustrate this let's use an example.

Imagine a lending protocol (Maker, AAVE, Benqi, Spectral.finance, etc..) that accepts Ethereum as collateral against stablecoin loans. What happens on a day like Black Thursday, when Ethereum prices cascade negatively to the tune of ~70% in a 48 hour time frame? Well, a lot of things happen 🤦.

![Black Thursday Img](https://github.com/ChaosLabsInc/chainlink-on-terra/blob/main/img/Cascading-ETH.png)

One critical aspect of responding to market volatility is protocol keepers triggering liquidations and thus ensuring protocol solvency.

With the ability to control Oracle return values, simulating such scenarios in your local development environment is possible.

### Oracle Manipulation

Oracle manipulation is an additional attack vector. With this method, malicious actors research data sources that various oracle consume as sources of truth. When actors possess the ability to manipulate the underlying data source they trigger downstream effects, manifesting in altered Oracle return values. As a result of manipulated data, actors and contracts can trigger various unwanted behaviors such as modified permissions, transaction execution, emergency pausing / shutdown and more.

With the ability to manipulate Chainlink Oracle return values, simulating such scenarios in your local development environment is possible.


### Pre-requisites
- `node` (version 16.14)
- `docker`
- `docker-compose`
- `typescript` installed globally such that the tsc compiler is available
- `ts-node`
- [`localterra`](https://github.com/terra-money/LocalTerra)

## Quickstart

1. 🛑 Git Clone command
2. cd `🛑 directory name`
3. `npm i` - Installing project libs
5. **In a separate terminal window (spwan a new window in iTerm with cdm+D)** run:
`docker-compose up`
6. `npm run cli`

After running the quickstart you should have the following: 2 terminals, 1 running docker-compose of localterra with chainlink depolyer, another running the cli-tool and it should look like this:

![Setup screenshot 1](https://github.com/ChaosLabsInc/chainlink-on-terra/blob/main/img/TerminalSetup1.png)

Once Chainlink LUNA\USD feed is deployed the terminal will look as follows:

![Setup screenshot 2](https://github.com/ChaosLabsInc/chainlink-on-terra/blob/main/img/TerminalSetup2.png)

## Recommended Usage
This repo is meant to serve as an implementation spec for deploying price feeds and mocking oracle return values. This is a resource and reference for smart contract developers to implement such strategies and practices as part of their development lifecycle.

### Example flow
1. View the deployed price feeds addresses
2. Mock price for selected price feed
    a. select the price feed to configure
    b. Set the desired price value returned by the price feed
    c. Mock 🤝 💥
3. Deploy new price feed
    a. enter the feed name
    b. set initial price for feed
    c. set feed decimals
    d. deploy

[![asciicast](https://github.com/ChaosLabsInc/chainlink-on-terra/blob/main/img/demo.svg)

## Start and reset LocalChainlink

- Start LocalTerra:

```sh
$ docker-compose up
```

Reset the world state:

```sh
$ docker-compose up
```