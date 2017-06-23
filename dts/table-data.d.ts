

export interface IDefaultTableData {
  SUITES_DESIGNATOR: string
}

export interface ITableData {
  ROOT_SUITE_NAME: string,
  SUITE_COUNT: number,
  SUITE_SKIPPED_COUNT: number,
  TEST_CASES_TOTAL: number,
  TEST_CASES_FAILED: number,
  TEST_CASES_PASSED: number,
  TEST_CASES_SKIPPED: number,
  TEST_CASES_STUBBED: number,
  TEST_FILE_MILLIS: number,
  TEST_SUMAN_MILLIS: number,
  OVERALL_DESIGNATOR: string
}
