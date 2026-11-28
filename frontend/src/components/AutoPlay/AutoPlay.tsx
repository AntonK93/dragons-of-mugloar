import { useEffect } from "react";
import { toast } from "react-toastify";
import GameStartActions from "../GameStartActions/GameStartActions";
import Icon from "../Icon/Icon";
import { getAutoPlayLog } from "../../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./AutoPlay.module.css";

function AutoPlay() {
    const dispatch = useAppDispatch();
    const gameData = useAppSelector((state) => state.game.gameData);
    const gameId = gameData?.gameId;
    const autoPlayActionLog = useAppSelector((state) => state.game.autoPlayActionLog);
    const lastAction = autoPlayActionLog?.at(-1);
    const isGameOver = autoPlayActionLog?.some((action) => action.type === "gameOver") ?? false;

    useEffect(() => {
        if (!gameId || isGameOver) {
            return;
        }

        let active = true;
        let timer: number;
        async function fetchLog() {
            const result = await dispatch(getAutoPlayLog());
            if (!active || isGameOver) {
                return;
            }
            if (getAutoPlayLog.rejected.match(result)) {
                toast.error("Could not fetch auto-play log");
            }
            timer = setTimeout(fetchLog, 2_000);
        }

        fetchLog();
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [dispatch, gameId, isGameOver]);

    return (
        <>
            <section className={`${shared.hero} ${shared.gameScreen}`} aria-labelledby="hero-title">
                <div className={shared.heroOrnament} aria-hidden="true">
                    <Icon name="shield" size={210} />
                </div>
                <div className={shared.heroContent}>
                    <p className={shared.eyebrow}>
                        {isGameOver ? "YOUR JOURNEY HAS ENDED" : "YOUR ADVENTURE CONTINUES"}
                    </p>
                    <h1 id="hero-title">
                        {isGameOver ? "You have fallen" : "Auto play in progress..."}
                    </h1>
                    <p className={shared.heroDescription}>
                        {isGameOver
                            ? "Your adventure may be over, but another story awaits."
                            : "Your hero is taking on quests in the realm of Mugloar."}
                    </p>
                    {gameData && (
                        <dl className={shared.gameOverStats}>
                            <div>
                                <dt>{isGameOver ? "LAST KNOWN SCORE" : "CURRENT SCORE"}</dt>
                                <dd>{lastAction?.score ?? gameData.score}</dd>
                            </div>
                            <div>
                                <dt>{isGameOver ? "LAST KNOWN TURN" : "TURNS"}</dt>
                                <dd>{lastAction?.turn ?? gameData.turn}</dd>
                            </div>
                        </dl>
                    )}
                    {isGameOver ? (
                        <GameStartActions />
                    ) : (
                        <span
                            className={styles.autoPlayStatus}
                            role="status"
                            aria-label="Auto-play in progress"
                        >
                            <span className={styles.spinner} aria-hidden="true" />
                        </span>
                    )}
                </div>
            </section>
            <section className={`${shared.panel} ${styles.logPanel}`} aria-labelledby="log-title">
                <h2 id="log-title">Auto-play log</h2>
                <ul className={styles.autoPlayLog} aria-label="Auto-play actions">
                    {autoPlayActionLog?.length ? (
                        autoPlayActionLog
                            .map((action, index) => (
                                <li
                                    className={styles.logEntry}
                                    key={`${action.timestamp}-${index}`}
                                >
                                    <div className={styles.logHeader}>
                                        <span className={styles.logTurn}>
                                            {action.type === "gameOver"
                                                ? "LAST KNOWN TURN"
                                                : "TURN"}{" "}
                                            {action.turn}
                                        </span>
                                        <time dateTime={action.timestamp}>
                                            {new Date(action.timestamp).toLocaleString()}
                                        </time>
                                    </div>
                                    <div className={styles.logAction}>
                                        <span className={styles.logActionType}>
                                            {action.type.toUpperCase()}
                                        </span>
                                        <span className={styles.logResult}>{action.result}</span>
                                    </div>
                                    <dl className={styles.logStats}>
                                        <div>
                                            <dt>Score</dt>
                                            <dd>{action.score ?? "\u2014"}</dd>
                                        </div>
                                        <div>
                                            <dt>Gold</dt>
                                            <dd>{action.gold}</dd>
                                        </div>
                                        <div>
                                            <dt>Lives</dt>
                                            <dd>{action.lives}</dd>
                                        </div>
                                        <div>
                                            <dt>People reputation</dt>
                                            <dd>{action.peopleReputation}</dd>
                                        </div>
                                        <div>
                                            <dt>State reputation</dt>
                                            <dd>{action.stateReputation}</dd>
                                        </div>
                                        <div>
                                            <dt>Underworld reputation</dt>
                                            <dd>{action.underworldReputation}</dd>
                                        </div>
                                    </dl>
                                </li>
                            ))
                            .reverse()
                    ) : (
                        <li className={styles.emptyLog}>Log is empty</li>
                    )}
                </ul>
            </section>
        </>
    );
}

export default AutoPlay;
