import AdventurePanel from "./components/AdventurePanel/AdventurePanel";
import AutoPlay from "./components/AutoPlay/AutoPlay";
import Inventory from "./components/Inventory/Inventory";
import GameStats from "./components/GameStats/GameStats";
import Icon from "./components/Icon/Icon";
import Merchant from "./components/Merchant/Merchant";
import Messages from "./components/Messages/Messages";
import Notifications from "./components/Notifications/Notifications";
import Reputation from "./components/Reputation/Reputation";
import { useAppSelector } from "./store/hooks";
import shared from "./shared.module.css";
import styles from "./App.module.css";

function App() {
    const gameData = useAppSelector((state) => state.game.gameData);
    const autoPlay = useAppSelector((state) => state.game.autoPlay);
    const gameId = gameData?.gameId;
    const showGame = Boolean(gameId);
    const isGameOver = useAppSelector((state) => state.game.gameOver);

    function getStatus() {
        if (autoPlay) {
            return "Auto-play in progress";
        }
        if (isGameOver) {
            return "Game over";
        }
        if (showGame) {
            return "Game in progress";
        }
        return "Ready to play";
    }

    return (
        <div>
            <Notifications />
            <header className={styles.topbar}>
                <button type="button" className={styles.brand} disabled={autoPlay}>
                    <span className={styles.brandMark}>
                        <Icon name="shield" size={23} />
                    </span>
                    <span>
                        <span className={styles.brandName}>DRAGONS</span>
                        <span className={styles.brandSubtitle}>OF MUGLOAR</span>
                    </span>
                </button>
                <span className={styles.previewBadge}>
                    <span className={styles.statusDot} /> {getStatus()}
                </span>
            </header>

            <main className={styles.page}>
                <div className={showGame ? shared.gameScreen : ""}>
                    {gameId && !isGameOver && !autoPlay ? (
                        <>
                            <div className={`${styles.sectionHeading} ${styles.overviewHeading}`}>
                                <div>
                                    <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>
                                        THE ADVENTURER
                                    </p>
                                    <h2>
                                        Your journey <span>at a glance</span>
                                    </h2>
                                </div>
                                <span className={styles.gameId}>
                                    GAME ID <strong>{gameId}</strong>
                                </span>
                            </div>

                            <div className={styles.gameLayout}>
                                <GameStats />
                                <div className={styles.gameContent}>
                                    <div className={styles.sidePanels}>
                                        <Merchant />
                                        <Inventory />
                                        <Reputation />
                                    </div>
                                    <div className={styles.contentGrid}>
                                        <Messages />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {autoPlay ? <AutoPlay /> : <AdventurePanel />}
                            {!isGameOver && !autoPlay && (
                                <section
                                    className={styles.adventureIntro}
                                    aria-labelledby="adventure-intro-title"
                                >
                                    <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>
                                        YOUR JOURNEY AWAITS
                                    </p>
                                    <h2 id="adventure-intro-title">
                                        A realm full of possibilities
                                    </h2>
                                    <div className={styles.adventureFeatures}>
                                        <div className={styles.adventureFeature}>
                                            <Icon name="scroll" size={24} />
                                            <h3>Choose your quests</h3>
                                            <p>Discover messages and find your next adventure.</p>
                                        </div>
                                        <div className={styles.adventureFeature}>
                                            <Icon name="shop" size={24} />
                                            <h3>Prepare for the road</h3>
                                            <p>
                                                Visit the merchant and equip yourself for the
                                                journey.
                                            </p>
                                        </div>
                                        <div className={styles.adventureFeature}>
                                            <Icon name="crown" size={24} />
                                            <h3>Make your mark</h3>
                                            <p>Build your reputation throughout the realm.</p>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
                <footer className={styles.footer}>
                    <span>DRAGONS OF MUGLOAR</span>
                    <span>FORTUNE FAVOURS THE BRAVE</span>
                </footer>
            </main>
        </div>
    );
}

export default App;
