import Icon from "../Icon/Icon";
import { useAppSelector } from "../../store/hooks";
import styles from "./GameStats.module.css";

function GameStats() {
    const game = useAppSelector((state) => state.game.gameData);

    if (!game) {
        return null;
    }

    return (
        <section className={styles.stats} aria-label="Game statistics">
            <div className={styles.stat}>
                <span className={`${styles.statIcon} ${styles.red}`}>
                    <Icon name="shield" />
                </span>
                <span>
                    <span className={styles.statLabel}>LIVES</span>
                    <strong>{game.lives}</strong>
                </span>
                <span className={styles.statCaption}>Stay in the fight</span>
            </div>
            <div className={styles.stat}>
                <span className={styles.statIcon}>
                    <Icon name="coin" />
                </span>
                <span>
                    <span className={styles.statLabel}>GOLD</span>
                    <strong>{game.gold}</strong>
                </span>
                <span className={styles.statCaption}>Your fortune</span>
            </div>
            <div className={styles.stat}>
                <span className={`${styles.statIcon} ${styles.blue}`}>
                    <Icon name="spark" />
                </span>
                <span>
                    <span className={styles.statLabel}>SCORE</span>
                    <strong>{game.score}</strong>
                </span>
                <span className={styles.statCaption}>Your legacy</span>
            </div>
            <div className={styles.stat}>
                <span className={`${styles.statIcon} ${styles.green}`}>
                    <Icon name="crown" />
                </span>
                <span>
                    <span className={styles.statLabel}>LEVEL</span>
                    <strong>{game.level}</strong>
                </span>
                <span className={styles.statCaption}>Your progress</span>
            </div>
            <div className={styles.stat}>
                <span className={styles.statIcon}>
                    <Icon name="scroll" />
                </span>
                <span>
                    <span className={styles.statLabel}>TURN</span>
                    <strong>{game.turn}</strong>
                </span>
                <span className={styles.statCaption}>Your journey</span>
            </div>
        </section>
    );
}

export default GameStats;
