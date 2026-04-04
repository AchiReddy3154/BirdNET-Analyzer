import { Router, type IRouter } from "express";
import healthRouter from "./health";
import historyRouter from "./history";
import birdnetRouter from "./birdnet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(birdnetRouter);
router.use(historyRouter);

export default router;
