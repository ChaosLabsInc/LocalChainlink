import { getPriceFeedName } from "../lib/utils";
import { ChainlinkCliAction, Cli } from "./cli";
import { ChainlinkDeployerClient } from "./client/chainlinkdeployerclient";
import Utils from "./utils"

async function main() {
  const chainlinkDeployer = await ChainlinkDeployerClient.Instance();
  const cli = new Cli(chainlinkDeployer);
  await cli.welcomeMessage();

  let performAdditionalAction = true;

  while (performAdditionalAction){
    const action = await cli.selectAction();
    switch(action) { 
      case ChainlinkCliAction.ViewFeeds: { 
        const { priceFeeds } = await cli.getPriceFeeds()
        Utils.logTable(["Base", "Quote", "Address"], priceFeeds.map(feed => ([feed.base, feed.quote, feed.address])))
        break; 
      } 
      case ChainlinkCliAction.MockPrice: { 
        const feed = await cli.selectFeedToMock();
        const price = await cli.selectPrice();
        console.log("Feed: ", getPriceFeedName(feed), "Price: ", price);
        await cli.mockPrice(feed, price);
        break; 
      } 
      case ChainlinkCliAction.DeployNewFeed: { 
        const feedName = await cli.enterFeedName()
        const feedInitialPrice = await cli.enterFeedInitialPrice();
        await cli.deployPriceFeed(feedName, feedInitialPrice);
        break; 
      } 
   }
  
    performAdditionalAction = await cli.needAdditionalAction();
  }
}

main();
