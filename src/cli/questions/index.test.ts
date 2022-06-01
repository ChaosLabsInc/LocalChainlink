import Questions from "./index";
const QUESTION_TEST_SUITE = "QUESTION_TEST_SUITE ";

test(`${QUESTION_TEST_SUITE} - getConfigurablePoolsQuestion`, () => {
  const configPFQuestions = Questions.getConfigurableFeedsQuestion([]);
  expect(configPFQuestions.length).toBeGreaterThan(0);
  expect(configPFQuestions[0]).toMatchObject({
    type: "rawlist",
    name: Questions.QUESTION_NAMES.CONFIGURABLE_FEEDS,
    message: "Select Chainlink price feed:",
    choices: [],
    default: [],
  });
});

test(`${QUESTION_TEST_SUITE} - getPriceChangeQuestion`, () => {
  const priceChangeQuestion = Questions.getPriceChangeQuestion();
  expect(priceChangeQuestion.length).toBeGreaterThan(0);
  expect(priceChangeQuestion[0]).toMatchObject({
    type: "number",
    name: Questions.QUESTION_NAMES.MOCK_PRICE_VALUE,
    message: "Select the new price",
    default: [0],
  });
});
