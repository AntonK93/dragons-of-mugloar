import type { ReactNode } from "react";

type IconName = "sword" | "shield" | "coin" | "scroll" | "shop" | "crown" | "spark" | "inventory";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
    const paths: Record<IconName, ReactNode> = {
        sword: (
            <>
                <path d="m14.5 17.5-8-8L4 4l5.5 2.5 8 8" />
                <path d="m13 19 6-6M16 16l4 4M5 19l4-4" />
            </>
        ),
        shield: (
            <>
                <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                <path d="M12 7v9M8.5 11h7" />
            </>
        ),
        coin: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M14.5 8.5c-1.5-1.8-5-1-5 .8 0 2.6 5 1.3 5 4 0 2-4 2.8-5.3.8" />
                <path d="M12 5.5v13" />
            </>
        ),
        scroll: (
            <>
                <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
            </>
        ),
        shop: (
            <>
                <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
                <path d="M3 10c0 2 3 3 4.5 0 1.5 3 4.5 3 4.5 0 1.5 3 4.5 3 4.5 0" />
                <path d="M16.5 10c1.5 3 4.5 2 4.5 0M9 20v-6h6v6" />
            </>
        ),
        crown: (
            <>
                <path d="m3 7 4 3 5-6 5 6 4-3-2 11H5L3 7ZM5 21h14" />
            </>
        ),
        inventory: (
            <>
                <path d="M7 8V7a5 5 0 0 1 10 0v1M6 9h12a2 2 0 0 1 2 2v9H4v-9a2 2 0 0 1 2-2Z" />
                <path d="M8 20v-6h8v6M9 4V3h6v1M10 14v2h4v-2" />
            </>
        ),
        spark: (
            <>
                <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
                <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
            </>
        ),
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name]}
        </svg>
    );
}

export default Icon;
