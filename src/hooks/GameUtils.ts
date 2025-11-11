import { useSharedValue } from "versapy/api";
import { useState } from "react";

export const useEloManager = (baseElo: number): [number, (value: number) => void] => {

    const [elo, setElo] = useState<number>(baseElo)
    const [shared, setShared] = useSharedValue<number>("bot_elo", (val) => setElo(val), elo)

    return [shared, setShared]

}