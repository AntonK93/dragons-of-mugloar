import GameStartActions from "../GameStartActions/GameStartActions";
import Icon from "../Icon/Icon";
import { useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./AdventurePanel.module.css";

function AdventurePanel() {
    const gameData = useAppSelector((state) => state.game.gameData);
    const isGameOver = useAppSelector((state) => state.game.gameOver);

    return (
        <>
            <section
                className={`${shared.hero} ${isGameOver ? shared.gameScreen : ""}`}
                aria-labelledby="hero-title"
            >
                <div className={shared.heroOrnament} aria-hidden="true">
                    <Icon name="shield" size={210} />
                </div>
                <div className={shared.heroContent}>
                    <p className={shared.eyebrow}>
                        {isGameOver ? "YOUR JOURNEY HAS ENDED" : "YOUR ADVENTURE AWAITS"}
                    </p>
                    <h1 id="hero-title">
                        {isGameOver ? (
                            "You have fallen"
                        ) : (
                            <>
                                A hero&apos;s story <em>begins here.</em>
                            </>
                        )}
                    </h1>
                    <p className={shared.heroDescription}>
                        {isGameOver ? (
                            "Your adventure may be over, but another story awaits."
                        ) : (
                            <>
                                Take on quests, earn your fortune, and make a name for yourself in
                                the realm of Mugloar.
                            </>
                        )}
                    </p>
                    {isGameOver && gameData && (
                        <dl className={shared.gameOverStats}>
                            <div>
                                <dt>{isGameOver ? "LAST KNOWN SCORE" : "FINAL SCORE"}</dt>
                                <dd>{gameData.score}</dd>
                            </div>
                            <div>
                                <dt>{isGameOver ? "LAST KNOWN TURN" : "TURNS"}</dt>
                                <dd>{gameData.turn}</dd>
                            </div>
                        </dl>
                    )}
                    <GameStartActions />
                </div>
                {!isGameOver && (
                    <div className={styles.heroBottom} aria-hidden="true">
                        <span>YOUR STORY IS YOURS TO WRITE</span>
                        <span>EST. IN THE REALM OF MUGLOAR</span>
                    </div>
                )}
            </section>
        </>
    );
}

export default AdventurePanel;
