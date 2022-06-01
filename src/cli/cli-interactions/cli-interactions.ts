import figlet from "figlet";
import clear from "clear";
import inquirer from "inquirer";
import Questions from "../questions";
import Utils from "../utils";

import { ChainlinkDeployerClient } from "../client/chainlinkdeployerclient";
import { IPriceFeed } from "../../lib/types";
import { getPriceFeedName } from "../../lib/utils";

const YOU_SELECTED = "You selected ";
const { logBlue, logGreen, logYellow } = Utils;
const { QUESTION_NAMES } = Questions;
const { prompt } = inquirer;

export enum ChainlinkCliAction {
  ViewFeeds = "View deployed feeds",
  MockPrice = "Mock price for feed",
  DeployNewFeed = "Deploy new feed"
} 

export class Cli{

  private chainlinkDeployerClient: ChainlinkDeployerClient;

  constructor(chainlinkDeployerClient: ChainlinkDeployerClient) {
  this.chainlinkDeployerClient = chainlinkDeployerClient;
  }

    public async welcomeMessage() {
    clear();
    logGreen("🎉 ✨ 🔥 Mocked Chainlink Oracles by: 🎉 ✨ 🔥");
    logBlue(figlet.textSync("Chaos Labs"));
  }

  public async selectAction(): Promise<ChainlinkCliAction> {
    const inquirerChoices = Object.values(ChainlinkCliAction);
    let selection: any = await prompt(Questions.getRequestedAction(inquirerChoices));
    let requestActionSelection = selection[QUESTION_NAMES.REQUESTED_ACTION];
    return <ChainlinkCliAction> requestActionSelection;
  }

  public async getPriceFeeds(){
    const priceFeeds = await this.chainlinkDeployerClient.getPriceFeeds()
    return {
      priceFeeds,
      inquirerChoices: priceFeeds.map(feed => getPriceFeedName(feed))
    }
  }

  public async selectFeedToMock(): Promise<IPriceFeed> {
    const { priceFeeds, inquirerChoices } = await this.getPriceFeeds();
    let feedSelection: any = await prompt(Questions.getConfigurableFeedsQuestion(inquirerChoices));
    let feedNameSelection = feedSelection[QUESTION_NAMES.CONFIGURABLE_FEEDS];
    logBlue(YOU_SELECTED + feedNameSelection);
    const feed = priceFeeds.find((feed) => getPriceFeedName(feed) === feedNameSelection);
    if (feed === undefined) {
      throw new Error("Feed selection invalid");
    }
    return feed;
  }

  public async selectPrice(): Promise<number> {
    const valueChangeSelection = await prompt(Questions.getPriceChangeQuestion());
    const val = valueChangeSelection[QUESTION_NAMES.MOCK_PRICE_VALUE].length > 0
        ? valueChangeSelection[QUESTION_NAMES.MOCK_PRICE_VALUE][0]
        : valueChangeSelection[QUESTION_NAMES.MOCK_PRICE_VALUE];
    logBlue(YOU_SELECTED + val);
    return val;
  }

  public async enterFeedName() : Promise<string> {
    const feedNameSelection = await prompt(Questions.getFeedName());
    return feedNameSelection[QUESTION_NAMES.FEED_NAME];
  }

  public async enterFeedInitialPrice(): Promise<number> {
    const feedNameSelection = await prompt(Questions.getFeedInitialPrice());
    const val = feedNameSelection[QUESTION_NAMES.FEED_INITIAL_PRICE].length > 0
      ? feedNameSelection[QUESTION_NAMES.FEED_INITIAL_PRICE][0]
      : feedNameSelection[QUESTION_NAMES.FEED_INITIAL_PRICE];
    return val;
  }

  public async needAdditionalAction() : Promise<boolean> {
    const feedNameSelection = await prompt(Questions.getNeedForAdditionalAction());
    return feedNameSelection[QUESTION_NAMES.ADDITIONAL_ACTION];
  }

  public async mockPrice(feed: IPriceFeed, price: number): Promise<void> {
    try {
      const originalPrice = await this.chainlinkDeployerClient.getPrice(feed.base, feed.quote);
      logBlue(`Original Price ${originalPrice}`);
      await this.chainlinkDeployerClient.setPrice(feed.base, feed.quote, price);

      const mockedPrices = await this.chainlinkDeployerClient.getPrice(feed.base, feed.quote);
      logBlue(`New Price ${mockedPrices}`);

      logBlue(`Let's get to work 💼 😏 ...`);
      logYellow(figlet.textSync("Celebrate"));
      logBlue(`You are a shadowy super code 🔥 ✨ 😏 ...`);
    } catch (err) {
      logYellow(`${err}`);
    }
  }

  public async deployPriceFeed(feedName: string, initialPrice: number){
    logBlue(`Deploying feed ${feedName} with initial price ${initialPrice}`)
    logBlue(`Operation might take a while ...`)

    const { base, quote } = Utils.parseFeedName(feedName);

    const feed = await this.chainlinkDeployerClient.createFeed(base, quote, initialPrice);
    Utils.logTable(["Base", "Quote", "Address"], [[feed.base, feed.quote, feed.address]])
  }
}
