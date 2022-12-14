/**
 * HTTP express server for the browser recorder client application.
 */
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Actor } from 'apify';
/**
 * loads .env config to the process - allows a custom configuration for the server
 */
import 'dotenv/config';

import { record, workflow, storage } from './routes';
import { BrowserPool } from "./browser-management/classes/BrowserPool";
import { Server } from "socket.io";

/**
 * Initialize the actor for Apify platform usage.
 */
(async() => await Actor.init())();

/**
 * Creates a new express server instance.
 * @type {express.Express}
 */

const app = express();
const port = process.env.DOCKER ? process.env.APIFY_CONTAINER_PORT : '8080';
/**
 * Enabling cors for communication with client on a different port/domain.
 */
app.use(cors());
/**
 * Automatic parsing of incoming JSON data.
 */
app.use(express.json())

/**
 * Initialize the server.
 * @type {http.Server}
 */
const server = http.createServer(app);

/**
 * Globally exported singleton instance of socket.io for socket communication with the client.
 * @type {Server}
 */
export const io = new Server(server);
/**
 * {@link BrowserPool} globally exported singleton instance for managing browsers.
 */
export const browserPool = new BrowserPool();

/**
 * For deployment
 */
const staticPath = path.resolve(__dirname, "../../build/static");
const buildPath = path.resolve(__dirname, "../../build");
const indexPath = path.resolve(__dirname, "../../build/index.html");

app.use("/", express.static(buildPath));
app.use("/static", express.static(staticPath));

app.all("/", (req, res) => {
    res.sendFile(indexPath);
});

/**
 * API routes for the server.
 */
app.use('/record', record);
app.use('/workflow', workflow);
app.use('/storage', storage);

server.listen(port, () => console.log(`Web server is listening and can be accessed 
at ${process.env.APIFY_CONTAINER_URL}! Port: ${port}`));
