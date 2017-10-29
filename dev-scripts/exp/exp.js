

const x = {
  watch: {


    per: {

      foo: {
        exec: 'suman test/*.js',
        include: [],
        exclude: [],
        confOverride: {},
        env: {}
      },

      bar: {
        exec: 'suman --browser test/front-end/*.js',
        include: [],
        exclude: [],
        confOverride: {}
      },

      baz: {
        exec: 'exec "${SUMAN_CHANGED_TEST_FILE}"',
        include: [],
        exclude: [],
        confOverride: {

        }
      }

    }

  }
};
