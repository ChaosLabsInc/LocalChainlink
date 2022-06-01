const QUESTION_PROMPT_NAMES = {
  REQUESTED_ACTION: "Requested Action",
  CONFIGURABLE_FEEDS: "Configurable Price Feeds",
  MOCK_PRICE_VALUE: "Mock price value",
  FEED_NAME: "Feed name",
  FEED_INITIAL_PRICE: "Feed initial Price",
  FEED_DECIMALS: "Feed decimals",
  ADDITIONAL_ACTION: "Additional action"

};


export = {
  QUESTION_NAMES: QUESTION_PROMPT_NAMES,
  getRequestedAction: function getRequestedAction(choices: Array<any>) {
    return [
      {
        type: "rawlist",
        name: QUESTION_PROMPT_NAMES.REQUESTED_ACTION,
        message: "Select requested action:",
        choices,
        default: [],
      },
    ];
  },
  getConfigurableFeedsQuestion: function getConfigurableFeedsQuestion(choices: Array<any>) {
    return [
      {
        type: "rawlist",
        name: QUESTION_PROMPT_NAMES.CONFIGURABLE_FEEDS,
        message: "Select Chainlink price feed:",
        choices,
        default: [],
      },
    ];
  },
  getPriceChangeQuestion: function getPriceChangeQuestion() {
    return [
      {
        type: "number",
        name: QUESTION_PROMPT_NAMES.MOCK_PRICE_VALUE,
        message: "Select the new price",
        default: [0],
      },
    ];
  },
  getFeedName: function getFeedName() {
    const feedNameRegex = new RegExp('([A-Z0-9]+)\/([A-Z0-9]+)')
    return [
      {
        type: "input",
        name: QUESTION_PROMPT_NAMES.FEED_NAME,
        message: "Enter the new feed name: (example: ATOM/USD)",
        validate:(answer: any) => {
          if (!feedNameRegex.test(answer)){
            return "invalid name. Expected name of the format <BASE>/<QUOTE>"
          }
          return true;
        }
      },
    ];
  },
  getFeedInitialPrice: function getFeedInitialPrice() {
    return [
      {
        type: "number",
        name: QUESTION_PROMPT_NAMES.FEED_INITIAL_PRICE,
        message: "Enter the new feed initial price",
        default: [1],
        validate:(answer: any) => {
          if (answer <= 0){
            return "invalid initial price. value must be greater than zero"
          }
          return true;
        }
      },
    ];
  },
  getNeedForAdditionalAction: function getNeedForAdditionalAction() {
    return [
      {
        type: "confirm",
        name: QUESTION_PROMPT_NAMES.ADDITIONAL_ACTION,
        message: "Would you like to do any additional action?",
      },
    ];
  },
};
