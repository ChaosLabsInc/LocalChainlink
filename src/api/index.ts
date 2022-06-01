import BigNumber from "bignumber.js";
import express, { Router } from "express";
import { IPriceBase } from "../lib/types";
import { getPriceFeedName } from "../lib/utils";
import { ChainlinkDeploymentManager } from "./chainlink_deployment_manager";
import { feeds } from "./config";
import {IDeployedPriceFeed, IPriceFeedConfig } from "./types";

const APP_PORT = "3010";
const DEFAULT_DECIMALS = 8;


async function initPriceFeeds(){
  const deploymentManager = await ChainlinkDeploymentManager.Instance();
  for(const feedConfiguration of feeds){
    await deploymentManager.deployPriceFeed(feedConfiguration);
  }

  return deploymentManager;
}

function startApp(deploymentManager: ChainlinkDeploymentManager){
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.get("/health", async function (req, res) {
    return res.sendStatus(200);
  });

  app.get("/feeds", async (req, res) => {
    try{
      const feeds = deploymentManager.priceFeeds.map(feed => feedToViewModel(feed));
      return res.status(200).json(feeds);
    }
    catch(e: any){
      console.log(e)
      return res.status(500).send(e.message)
    }
  });

  app.put("/feed", async (req, res) => {
    const feedRequest: IPriceFeedConfig = {
      base: req.body.base,
      quote: req.body.quote,
      initialPrice: req.body.initialPrice,
      decimals: req.body.decimals ?? DEFAULT_DECIMALS
    };

    let deployedFeeds:IDeployedPriceFeed[] = [];
    try {
      validateBaseRequest(feedRequest);
      if(feedRequest.initialPrice === undefined){
        throw new Error("Must specify 'initialPrice'")
      }
    }
    catch(e: any)
    {
      return res.status(400).send(e.message)
    }

    try {
      deployedFeeds = deploymentManager.getPriceFeed(feedRequest.base, feedRequest.quote);
      if (deployedFeeds.length > 0){
        return res.status(200).json(feedToViewModel(deployedFeeds[0]));
      }
      const feed = await deploymentManager.deployPriceFeed(feedRequest);
      return res.status(200).json(feed);
    }
    catch(e: any){
      console.log(e)
      return res.status(500).send(e.message)
    }
  })


  app.get("/price", async (req, res) => {
    const priceRequest: IPriceBase = {
      base: req.query.base as string,
      quote: req.query.quote as string,
    };

    let deployedFeeds:IDeployedPriceFeed[] = [];
    try {
      validateBaseRequest(priceRequest);

      deployedFeeds = deploymentManager.getPriceFeed(priceRequest.base, priceRequest.quote);
      if (deployedFeeds.length === 0){
        throw new Error(`Price feed ${getPriceFeedName(priceRequest)} is not deployed`)
      }
    }
    catch(e: any)
    {
      return res.status(400).send(e.message)
    }

    try {
    const price = await deploymentManager.getLatestPrice(deployedFeeds[0].address);
    const computed = new BigNumber(price).dividedBy(new BigNumber(10).pow(8)).toString()
    return res.status(200).send(computed);
    }
    catch(e: any){
      console.log(e)
      return res.status(500).send(e.message)
    }
  });


  app.post("/price", async (req, res) => {
    const priceRequest = {
      base: req.body.base,
      quote: req.body.quote,
      price: req.body.price
    };

    let deployedFeeds:IDeployedPriceFeed[] = [];
    try {
      validateBaseRequest(priceRequest);
      if(priceRequest.price === undefined){
        throw new Error("Must specify 'price'")
      }

      deployedFeeds = deploymentManager.getPriceFeed(priceRequest.base, priceRequest.quote);
      if (deployedFeeds.length === 0){
        throw new Error(`Price feed ${getPriceFeedName(priceRequest)} is not deployed`)
      }
    }
    catch(e: any)
    {
      return res.status(400).send(e.message)
    }

    try {
      await deploymentManager.setPrice(deployedFeeds[0], priceRequest.price);
      return res.sendStatus(200);
    }
    catch(e: any){
      console.log(e)
      return res.status(500).send(e.message)
    }
  })


  
  const server = app.listen(APP_PORT, async () => {
    console.log(`Controller listening on port: ${APP_PORT}`);
  });
}

initPriceFeeds().then((deploymentManager) => startApp(deploymentManager))

const feedToViewModel = (feed: IDeployedPriceFeed) => { return {
  base: feed.base,
  quote: feed.quote,
  address: feed.address
}}

const validateBaseRequest = (feedBaseRequest: IPriceBase) => {
  if(feedBaseRequest.base === undefined){
    throw new Error("Must specify 'base'")
  }
  if(feedBaseRequest.quote === undefined){
    throw new Error("Must specify 'quote'")
  }
}