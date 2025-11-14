import { Link } from "react-router-dom"


const NotFoundView = () => {

    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgb(44, 44, 44)"
        }}>
            <p style={{
                color: "white",
                fontSize: "6em"
            }}>
                404
            </p>
            <Link to="/dash">Dashboard</Link>
        </div>
    )

}

export default NotFoundView;