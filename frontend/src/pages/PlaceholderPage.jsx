import { useLocation } from 'react-router-dom';

export default function PlaceholderPage() {
    const location = useLocation();
    const title = location.pathname
        .split('/')
        .filter(Boolean)
        .map((part) => part.replace(/-/g, ' '))
        .join(' / ');

    const formattedTitle = title
        ? title.replace(/\b\w/g, (letter) => letter.toUpperCase())
        : 'Module';

    return (
    <div className="page-container">
        <section className="placeholder-page">
            <p className="eyebrow">MODULE FOUNDATION</p>
            <h2>{formattedTitle}</h2>
            <p>
            The shared layout, routing and role protection are ready. This module
            will be connected to the existing backend APIs in the next stage.
            </p>
            <span className="status-badge">NOT IMPLEMENTED YET</span>
        </section>
        </div>
    );
}
