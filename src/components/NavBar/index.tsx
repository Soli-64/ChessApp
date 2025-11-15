import { Link, useNavigate } from "react-router-dom"
import "./NavBar.css"

type LinkProp = {
    name: string
    path: string
    icon_path?: string
}

type NavBarProps = {
    links: LinkProp[]
}

export const NabBar = (props: NavBarProps) => {

    const { links } = props;
    let navigate = useNavigate();

    return (
        <div className="navbar-container">
            {
                links.map(l => (
                    <button key={l.name} onClick={() => navigate(l.path)} className="navbar-btn">
                        {l.name[0]}
                    </button>
                ))
            }
        </div>
    )

}