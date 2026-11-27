import Icon from "../Icon/Icon";
import { useAppSelector } from "../../store/hooks";
import shared from "../../shared.module.css";
import styles from "./Inventory.module.css";

function Inventory() {
    const items = useAppSelector((state) => state.game.items);

    return (
        <section
            className={`${shared.panel} ${shared.sidePanel}`}
            aria-labelledby="inventory-title"
        >
            <div className={shared.headingWithIcon}>
                <span className={shared.headingIcon}>
                    <Icon name="inventory" />
                </span>
                <div>
                    <p className={`${shared.eyebrow} ${shared.darkEyebrow}`}>YOUR BELONGINGS</p>
                    <h2 id="inventory-title">Inventory</h2>
                </div>
            </div>
            {items?.length ? (
                <ul className={styles.itemList} aria-label="Inventory items" tabIndex={0}>
                    {items.map((item, index) => (
                        <li className={styles.item} key={`${item.id}-${index}`}>
                            {item.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className={styles.emptyState}>Your inventory is empty.</p>
            )}
        </section>
    );
}

export default Inventory;
