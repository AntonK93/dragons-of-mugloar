import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../Icon/Icon";
import { getMessages, solveMessage } from "../../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./Messages.module.css";

function Messages() {
    const dispatch = useAppDispatch();
    const messages = useAppSelector((state) => state.game.messages);
    const gameData = useAppSelector((state) => state.game.gameData);
    const reputation = useAppSelector((state) => state.game.reputationData);
    const autoPlay = useAppSelector((state) => state.game.autoPlay);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (gameData?.gameId) {
            handleRefresh();
        }
    }, [gameData?.gameId, gameData?.turn, reputation]);

    async function handleRefresh() {
        setIsLoading(true);
        const result = await dispatch(getMessages());
        if (getMessages.rejected.match(result)) {
            toast.error("Could not fetch messages");
        }
        setIsLoading(false);
    }

    async function handleSolve(adId: string) {
        setIsLoading(true);
        const result = await dispatch(solveMessage(adId));
        if (solveMessage.fulfilled.match(result)) {
            await handleRefresh();
        }
        setIsLoading(false);
    }

    return (
        <section className={shared.panel} aria-labelledby="messages-title">
            <div className={styles.panelHeading}>
                <div className={shared.headingWithIcon}>
                    <span className={shared.headingIcon}>
                        <Icon name="scroll" />
                    </span>
                    <div>
                        <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>YOUR ADVENTURES</p>
                        <h2 id="messages-title">Messages</h2>
                    </div>
                </div>
                <div className={styles.headingActions}>
                    <button
                        className={`${shared.button} ${shared.buttonOutline}`}
                        type="button"
                        onClick={() => handleRefresh()}
                        disabled={!gameData?.gameId || isLoading || autoPlay}
                    >
                        Refresh messages
                    </button>
                </div>
            </div>
            <div className={styles.messageListContainer}>
                <ul className={styles.messageList} aria-label="Available messages">
                    {messages?.map((message) => (
                        <li className={styles.message} key={message.adId}>
                            <div className={styles.messageHeader}>
                                <span className={styles.messageType}>
                                    <Icon name="sword" size={16} />
                                    QUEST
                                </span>
                                <span className={styles.reward}>
                                    <Icon name="coin" size={16} />
                                    {message.reward} gold
                                </span>
                            </div>
                            <strong className={styles.messageText}>{message.message}</strong>
                            <div className={styles.messageDetails}>
                                <div>
                                    <span>Success chance</span>
                                    <strong>{message.probability}</strong>
                                </div>
                                <div>
                                    <span>Expires in</span>
                                    <strong>{message.expiresIn} turns</strong>
                                </div>
                            </div>
                            <button
                                className={`${shared.button} ${styles.solveButton}`}
                                type="button"
                                onClick={() => handleSolve(message.adId)}
                                disabled={isLoading || autoPlay}
                            >
                                <Icon name="sword" size={16} />
                                Solve
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default Messages;
