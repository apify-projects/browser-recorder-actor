/**
 * A group of functions for storing recordings on the file system.
 * Functions are asynchronous to unload the server from heavy file system operations.
 */
import { Actor } from 'apify';

/**
 * Reads a key from the Key-Value store and returns its content.
 * @param key The key that should be opened.
 * @returns {Promise<string>}
 * @category WorkflowManagement-Storage
 */
export const readKey = (key: string): Promise<null|Record<string, any>> => {
    return Actor.getValue(key);
};

/**
 * Writes a string to a Key-Value store. If the key already exists, it is overwritten.
 * @param key The key.
 * @param data The data to write to the storage.
 * @returns {Promise<void>}
 * @category WorkflowManagement-Storage
 */
export const saveKey = (key: string, data: Record<string, unknown>): Promise<void> => {
  return Actor.setValue(key, data);
};

/**
 * Deletes a record from the key-Value store.
 * @param key The key identifier of the record.
 * @returns {Promise<void>}
 * @category WorkflowManagement-Storage
 */
export const deleteKey = (key: string): Promise<void> => {
  return Actor.setValue(key, null);
};

/**
 * A helper function to apply a callback to the all resolved
 * promises made out of an array of the items.
 * @param items An array of items.
 * @param block The function to call for each item after the promise for it was resolved.
 * @returns {Promise<any[]>}
 * @category WorkflowManagement-Storage
 */
function promiseAllP(items: any, block: any) {
  let promises: any = [];
  items.forEach(function(item : any, index: number) {
    promises.push( function(item,i) {
      return new Promise(function(resolve, reject) {
        // @ts-ignore
        return block.apply(this,[item,index,resolve,reject]);
      });
    }(item,index))
  });
  return Promise.all(promises);
}

/**
 * Reads all records from a default Key-Value store and returns an array of their contents.
 * @category WorkflowManagement-Storage
 * @returns {Promise<string[]>}
 */
export const readKeys = async(type: 'recordings'|'runs'): Promise<string[]> => {
  const client = Actor.newClient();
  const defaultStore = await Actor.openKeyValueStore();
  const keyValueStoreClient = client.keyValueStore(defaultStore.id);
  const listKeysResult = await keyValueStoreClient.listKeys();
  const keys = type === 'recordings'
    ? listKeysResult.items.filter((item) => {(item.key.includes('waw'))})
    : listKeysResult.items.filter((item) => {(!item.key.includes('waw') && item.key.includes('json'))});
  return new Promise((resolve, reject) => {
    promiseAllP(keys, (key: string) => readKey(key)).then(results => {
        return resolve(results);
      }).catch(error => {
        return reject(error);
      });
  });
}



