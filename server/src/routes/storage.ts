/**
 * RESTful API endpoints handling the recording storage.
 */

import { Router } from 'express';
import logger from "../logger";
import { deleteKey, readKey, readKeys, saveKey } from "../workflow-management/storage";
import { createRemoteBrowserForRun, destroyRemoteBrowser } from "../browser-management/controller";
import { chromium } from "playwright";
import { browserPool } from "../server";
import { uuid } from "uuidv4";

export const router = Router();

/**
 * Logs information about recordings API.
 */
router.all('/', (req, res, next) => {
  logger.log('debug',`The recordings API was invoked: ${req.url}`)
  next() // pass control to the next handler
})

/**
 * GET endpoint for getting an array of all stored recordings.
 */
router.get('/recordings', async (req, res) => {
  try {
    const data = await readKeys('recordings');
    return res.send(data);
  } catch (e) {
    const { message } = e as Error;
    logger.log('info', `Error while reading recordings - ${message}`);
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a recording from the storage.
 */
router.delete('/recordings/:fileName', async (req, res) => {
  try {
    await deleteKey(`${req.params.fileName}.waw.json`);
    return res.send(true);
  } catch (e) {
    const {message} = e as Error;
    logger.log('info', `Error while deleting a recording with name: ${req.params.fileName}.waw.json`);
    return res.send(false);
  }
});

/**
 * GET endpoint for getting an array of runs from the storage.
 */
router.get('/runs', async (req, res) => {
  try {
    const data = await readKeys('runs');
    return res.send(data);
  } catch (e) {
    logger.log('info', 'Error while reading runs');
    return res.send(null);
  }
});

/**
 * DELETE endpoint for deleting a run from the storage.
 */
router.delete('/runs/:fileName', async (req, res) => {
  try {
    await deleteKey(`${req.params.fileName}.json`);
    return res.send(true);
  } catch (e) {
    const {message} = e as Error;
    logger.log('info', `Error while deleting a run with name: ${req.params.fileName}.json`);
    return res.send(false);
  }
});

/**
 * PUT endpoint for starting a remote browser instance and saving run metadata to the storage.
 * Making it ready for interpretation and returning a runId.
 */
router.put('/runs/:fileName', async (req, res) => {
  try {
    const id = createRemoteBrowserForRun({
      browser: chromium,
      launchOptions: { headless: true }
    });

    const runId = uuid();

    const run_meta = {
      status: 'RUNNING',
      name: req.params.fileName,
      startedAt: new Date().toLocaleString(),
      finishedAt: '',
      duration: '',
      task: req.body.params ? 'task' : '',
      browserId: id,
      interpreterSettings: req.body,
      log: '',
      runId,
    };
    await saveKey(
      `${req.params.fileName}_${runId}.json`,
      { ...run_meta }
    );
    logger.log('debug', `Created run with name: ${req.params.fileName}.json`);
    return res.send({
      browserId: id,
      runId: runId,
    });
  } catch (e) {
    const {message} = e as Error;
    logger.log('info', `Error while creating a run with name: ${req.params.fileName}.json`);
    return res.send('');
  }
});

/**
 * GET endpoint for getting a run from the storage.
 */
router.get('/runs/run/:fileName/:runId', async (req, res) => {
  try {
    // read the run from storage
    const parsedRun = await readKey(`${req.params.fileName}_${req.params.runId}.json`)
    return res.send(parsedRun);
  } catch (e) {
    const { message } = e as Error;
    logger.log('error', `Error ${message} while reading a run with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(null);
  }
});

/**
 * PUT endpoint for finishing a run and saving it to the storage.
 */
router.post('/runs/run/:fileName/:runId', async (req, res) => {
  try {
    // read the recording from storage
    const parsedRecording = await readKey(`${req.params.fileName}.waw.json`)
    // read the run from storage
    const parsedRun = await readKey(`${req.params.fileName}_${req.params.runId}.json`)

    // interpret the run in active browser
    if (parsedRecording && parsedRun) {
    const browser = browserPool.getRemoteBrowser(parsedRun.browserId);
    const currentPage = browser?.getCurrentPage();
    if (browser && currentPage) {
      const interpretationInfo = await browser.interpreter.InterpretRecording(
        parsedRecording.recording, currentPage, parsedRun.interpreterSettings);
      const duration = Math.round((new Date().getTime() - new Date(parsedRun.startedAt).getTime()) / 1000);
      const durString = (() => {
        if (duration < 60) {
          return `${duration} s`;
        } else {
          const minAndS = (duration / 60).toString().split('.');
          return `${minAndS[0]} m ${minAndS[1]} s`;
        }
      })();
      await destroyRemoteBrowser(parsedRun.browserId);
      const run_meta = {
        ...parsedRun,
        status: interpretationInfo.result,
        finishedAt: new Date().toLocaleString(),
        duration: durString,
        browserId: null,
        log: interpretationInfo.log.join('\n'),
        serializableOutput: interpretationInfo.serializableOutput,
        binaryOutput: interpretationInfo.binaryOutput,
      };
      await saveKey(
        `${parsedRun.name}_${req.params.runId}.json`,
        run_meta
      );
      return res.send(true);
    } else {
      throw new Error('Could not destroy browser');
    }
  } else {
      throw new Error('Could not read run or recording');
    }
  } catch (e) {
    const {message} = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});

/**
 * POST endpoint for aborting a current interpretation of the run.
 */
router.post('/runs/abort/:fileName/:runId', async (req, res) => {
  try {
    // read the run from storage
    const parsedRun = await readKey(`${req.params.fileName}_${req.params.runId}.json`)

    //get current log
    if (parsedRun) {
    const browser = browserPool.getRemoteBrowser(parsedRun.browserId);
    const currentLog = browser?.interpreter.debugMessages.join('/n');
    const serializableOutput = browser?.interpreter.serializableData.reduce((reducedObject, item, index) => {
      return {
        [`item-${index}`]: item,
        ...reducedObject,
      }
    }, {});
    const binaryOutput = browser?.interpreter.binaryData.reduce((reducedObject, item, index) => {
      return {
        [`item-${index}`]: item,
        ...reducedObject,
      }
    }, {});
    const run_meta = {
      ...parsedRun,
      status: 'ABORTED',
      finishedAt: null,
      duration: '',
      browserId: null,
      log: currentLog,
    };

    await saveKey(
      `${parsedRun.name}_${req.params.runId}.json`,
      { ...run_meta, serializableOutput, binaryOutput }
    );
    return res.send(true);
  }
  } catch (e) {
    const {message} = e as Error;
    logger.log('info', `Error while running a recording with name: ${req.params.fileName}_${req.params.runId}.json`);
    return res.send(false);
  }
});
