import { useState } from "react";
import { toast } from "react-toastify";
import Icon from "../Icon/Icon";
import { resetGame, startAutoPlay, startGame } from "../../store/gameSlice";
import { useAppDispatch } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./GameStartActions.module.css";

function GameStartActions() {
    const dispatch = useAppDispatch();
    const [loadingAction, setLoadingAction] = useState<"game" | "autoPlay" | null>(null);

    async function handleStart() {
        setLoadingAction("game");
        dispatch(resetGame());
        const result = await dispatch(startGame());
        if (startGame.rejected.match(result)) {
            toast.error("Could not start the game");
        }
        setLoadingAction(null);
    }

    async function handleStartAutoPlay() {
        setLoadingAction("autoPlay");
        const result = await dispatch(startAutoPlay());
        if (startAutoPlay.rejected.match(result)) {
            toast.error("Could not start auto-play");
        }
        setLoadingAction(null);
    }

    return (
        <div className={styles.heroActions}>
            <button
                className={[shared.button, shared.buttonPrimary, styles.heroStart].join(" ")}
                type="button"
                onClick={() => handleStart()}
                disabled={loadingAction !== null}
            >
                <Icon name="sword" size={20} />
                {loadingAction === "game" ? "Starting game..." : "Start a new game"}
            </button>
            <button
                className={[shared.button, styles.heroStart, styles.heroAutoPlay].join(" ")}
                type="button"
                onClick={() => handleStartAutoPlay()}
                disabled={loadingAction !== null}
            >
                <Icon name="spark" size={20} />
                {loadingAction === "autoPlay" ? "Starting auto play..." : "Start auto play"}
            </button>
        </div>
    );
}

export default GameStartActions;
