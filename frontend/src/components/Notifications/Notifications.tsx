import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Notifications.module.css";

function Notifications() {
    return (
        <ToastContainer
            className={styles.toastContainer}
            toastClassName={styles.toast}
            position="top-right"
            autoClose={5000}
            pauseOnHover={false}
            pauseOnFocusLoss={false}
        />
    );
}

export default Notifications;
