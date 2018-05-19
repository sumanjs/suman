#!/usr/bin/env node

'use strict';

const suman = require('suman');

const {
  Test
} = suman.init(module);

Test.create((b, it, context, before, after, beforeEach, afterEach) => {

  const {
    Builder,
    By,
    Key,
    until
  } = require('selenium-webdriver');

  const driver = new Builder().forBrowser('firefox').build();

  after.always(async h => {

    await driver.quit();

  });

  context(b => {

    before(async h => {

      await driver.get('https://github.com/oresoftware');

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      await driver.get('https://github.com/irossimoline/angular4-material-table');

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      await driver.get('https://github.com/irossimoline/angular4-material-table/stargazers');

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      const el = h.supply.el = await driver.find(By.id())

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      await driver.get('https://github.com/notifications');

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

  context(b => {

    before(async h => {

      await driver.get('https://www.quora.com/How-good-was-Hristo-Stoichkov-as-a-player/answer/Aditya-Gaonkar-4?__filter__&amp;__nsrc__&#x3D;2&amp;__snid3__&#x3D;1898457259');

    });

    it(async t => {

      const el = t.supply.el;

    });

  });

});
