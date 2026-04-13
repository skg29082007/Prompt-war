import { Router, type IRouter } from "express";
import healthRouter from "./health";
import zonesRouter from "./zones";
import queuesRouter from "./queues";
import alertsRouter from "./alerts";
import analyticsRouter from "./analytics";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(zonesRouter);
router.use(queuesRouter);
router.use(alertsRouter);
router.use(analyticsRouter);
router.use(staffRouter);

export default router;
