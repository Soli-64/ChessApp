import { Outlet } from "react-router-dom"
import { NabBar } from "../../components/NavBar";

const StaticLayout = () => {

    return (
        <div style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
        }}>
            <NabBar links={[
                {
                    name: "Dashboard",
                    path: "/dash"
                },
                {
                    name: "Play",
                    path: "/play"
                },
                {
                    name: "Analyzer",
                    path: "/analyze"
                },
            ]} />
            <div 
                style={{
                    paddingLeft: "4vw"
                }}
            >
                <Outlet/>
            </div>
        </div>
    )

}

export default StaticLayout;