import { useState } from "react";
import { toast } from "react-toastify";
import Icon from "../Icon/Icon";
import { investigateReputation } from "../../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./Reputation.module.css";
import { errorCodes } from "../../errorCodes";

function Reputation() {
    const dispatch = useAppDispatch();
    const reputation = useAppSelector((state) => state.game.reputationData);
    const gameId = useAppSelector((state) => state.game.gameData?.gameId);
    const autoPlay = useAppSelector((state) => state.game.autoPlay);
    const [isLoading, setIsLoading] = useState(false);

    async function handleInvestigate() {
        setIsLoading(true);
        const result = await dispatch(investigateReputation());
        if (
            investigateReputation.rejected.match(result) &&
            result.error.code !== errorCodes.GAME_OVER
        ) {
            toast.error("Could not fetch player reputation");
        }
        setIsLoading(false);
    }

    return (
        <section
            className={`${shared.panel} ${shared.sidePanel}`}
            id="reputation"
            aria-labelledby="reputation-title"
        >
            <div className={shared.headingWithIcon}>
                <span className={shared.headingIcon}>
                    <Icon name="crown" />
                </span>
                <div>
                    <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>
                        YOUR NAME IN THE REALM
                    </p>
                    <h2 id="reputation-title">Reputation</h2>
                </div>
            </div>
            <div className={styles.reputationList}>
                <div>
                    <span>People</span>
                    <strong>{reputation?.people ?? "-"}</strong>
                </div>
                <div>
                    <span>State</span>
                    <strong>{reputation?.state ?? "-"}</strong>
                </div>
                <div>
                    <span>Underworld</span>
                    <strong>{reputation?.underworld ?? "-"}</strong>
                </div>
            </div>
            <button
                className={`${shared.button} ${shared.buttonOutline} ${styles.fullWidth}`}
                type="button"
                onClick={() => handleInvestigate()}
                disabled={!gameId || isLoading || autoPlay}
            >
                Investigate reputation
            </button>
        </section>
    );
}

export default Reputation;
