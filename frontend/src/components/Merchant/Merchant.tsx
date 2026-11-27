import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Icon from "../Icon/Icon";
import { buyItem, getShopItems } from "../../store/gameSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./Merchant.module.css";

function Merchant() {
    const dispatch = useAppDispatch();
    const shopItems = useAppSelector((state) => state.game.shopItems);
    const gameId = useAppSelector((state) => state.game.gameData?.gameId);
    const autoPlay = useAppSelector((state) => state.game.autoPlay);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (gameId) {
            handleRefresh();
        }
    }, [gameId]);

    async function handleRefresh() {
        setIsLoading(true);
        const result = await dispatch(getShopItems());
        if (getShopItems.rejected.match(result)) {
            toast.error("Could not fetch shop items");
        }
        setIsLoading(false);
    }

    return (
        <section
            className={`${shared.panel} ${shared.sidePanel}`}
            id="shop"
            aria-labelledby="shop-title"
        >
            <div className={shared.headingWithIcon}>
                <span className={shared.headingIcon}>
                    <Icon name="shop" />
                </span>
                <div>
                    <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>
                        PREPARE FOR THE ROAD
                    </p>
                    <h2 id="shop-title">The merchant</h2>
                </div>
            </div>
            <ul className={styles.itemList} aria-label="Shop items" tabIndex={0}>
                {shopItems?.map((item) => (
                    <li className={styles.item} key={item.id}>
                        <div className={styles.itemDetails}>
                            <strong>{item.name}</strong>
                            <span>{item.cost} gold</span>
                        </div>
                        <button
                            className={`${shared.button} ${shared.buttonOutline}`}
                            type="button"
                            onClick={() => dispatch(buyItem(item.id))}
                            disabled={!gameId || isLoading || autoPlay}
                        >
                            Buy
                        </button>
                    </li>
                ))}
            </ul>
            <button
                className={`${shared.button} ${shared.buttonOutline} ${styles.refreshButton}`}
                type="button"
                onClick={() => handleRefresh()}
                disabled={!gameId || isLoading || autoPlay}
            >
                Refresh items
            </button>
        </section>
    );
}

export default Merchant;
