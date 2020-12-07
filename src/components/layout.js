import React from "react" // Default로 선언하여 export된 경우 바로 사용가능
import { Link } from "gatsby" // default로 선언되지 않은 것들은 export된 변수명으로! 괄호안에서 사용!

import Navbar from "./Navbar/Navbar"
import styled from "styled-components"

const LayoutWrapper = styled.div`
  background-color: var(--bg);
  color: var(--textNormal);
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--textTitle);
  }
  a {
    color: var(--textLink);
  }
  a:hover {
    color: var(--textLinkHover);
  }
  blockquote {
    color: var(--textNormal);
  }

  code,
  kbd,
  samp {
    color: var(--textCode);
  }
  transition: color 0.2s ease-out, background 0.2s ease-out
`

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <LayoutWrapper>
      <Navbar/>
      <div className="global-wrapper" data-is-root-path={isRootPath}>
        <header className="global-header">{header}</header>
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </footer>
      </div>
    </LayoutWrapper>
  )
}

export default Layout
