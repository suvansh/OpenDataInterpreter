import React from 'react';
import Image from 'next/image';

const NavBar = () => {
    const [isActiveMenu, setIsActiveMenu] = React.useState(false);

    const toggleActiveMenu = () => {
        setIsActiveMenu(prev => !prev);
    };

    return (
        <nav
            id="td-navbar"
            className="td-navbar td-navbar-container-shadow td-navbar-container-blur align-center"
            role="navigation"
            aria-label="main navigation"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                height: '60px',
                maxWidth: '100vw',
                width: '100%',
                zIndex: 1000,
                backgroundColor: '#222'
            }}
        >
            <div className="td-navbar-brand">
                <a href="https://brilliantly.ai" target="_self" className="td-navbar-item td-navbar-item-color-gradient">
                    <div className="td-navbar-brand-logo">
                    <Image
                        src="/brilliantly_logo.png"
                        alt="website logo"
                        width="28"
                        height="28"
                        style={{
                            maxHeight: '3rem',
                        }}
                    />
                    </div>
                    <div
                        className="td-navbar-item-link"
                        role="none"
                        style={{
                            color: '#9D8EEE'
                        }}
                    >
                        <span
                        style={{
                            backgroundImage: 'linear-gradient(135deg, #CB5EEE 0%, #4BE1EC 100%)',
                            fontFamily: 'Quicksand'
                        }}
                        >
                        brilliantly
                        </span>
                    </div>
                </a>
                <a role="button"
                    className={`td-navbar-burger${isActiveMenu ? ' is-active' : ''}`}
                    tabIndex={0} aria-label="menu" aria-expanded={isActiveMenu}
                    onClick={toggleActiveMenu}>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <div className={`td-navbar-mobile${isActiveMenu ? ' is-active' : ''}`} style={{top: '60px', maxHeight: 'calc(100vh - 60px)'}}>
                <a href="https://brilliantly.ai/coaching" target="_self" className="td-navbar-item td-navbar-item-color-gradient">
                    <div className="td-navbar-item-link" role="none" style={{color:'#5CD4AC'}}>
                        <span style={{backgroundImage:'linear-gradient(135deg, #D6FF7F 0%, #00B3CC 100%)'}}>AI Coaching</span>
                    </div>
                </a>
                <a href="https://brilliantly.ai/blog" target="_self" className="td-navbar-item" rel="noreferrer">
                    <div className="td-navbar-item-link" role="none" style={{color:'#ffffff'}}>
                        <span>Blog</span>
                    </div>
                </a>
                <a href="https://brilliantly.ai/consulting/request" target="_self" className="td-navbar-item" rel="noreferrer">
                    <div className="td-navbar-item-button" role="none" style={{color:'#ffffff',background:'linear-gradient(135deg, #CB5EEE 0%, #4BE1EC 100%)',boxShadow:'0 10px 20px -10px var(--shadow-color-candy)'}}>
                        <span>Solutions →</span>
                    </div>
                </a>
            </div>
            <div className="td-navbar-middle"></div>
            <div className="td-navbar-end">
                <a href="https://brilliantly.ai/coaching" target="_self" className="td-navbar-item td-navbar-item-color-gradient">
                    <div className="td-navbar-item-link" role="none" style={{color:'#5CD4AC'}}>
                        <span style={{backgroundImage:'linear-gradient(135deg, #D6FF7F 0%, #00B3CC 100%)'}}>AI Coaching</span>
                    </div>
                </a>
                <a href="https://brilliantly.ai/blog" target="_self" className="td-navbar-item" rel="noreferrer">
                    <div className="td-navbar-item-link" role="none" style={{color:'#ffffff'}}>
                        <span>Blog</span>
                    </div>
                </a>
                <a href="https://brilliantly.ai/consulting/request" target="_self" className="td-navbar-item" rel="noreferrer">
                    <div className="td-navbar-item-button" role="none" style={{color:'#ffffff',background:'linear-gradient(135deg, #CB5EEE 0%, #4BE1EC 100%)',boxShadow:'0 10px 20px -10px var(--shadow-color-candy)'}}>
                        <span>Solutions →</span>
                    </div>
                </a>
            </div>
        </nav>
    );
};

export default NavBar;