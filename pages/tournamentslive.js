import React from 'react'
import { styled, createGlobalStyle } from 'styled-components'
import Navbar from "@/components/Navbar"
import Hero from "@/components/tournamentslive/Hero"

const GlobalStyle = createGlobalStyle`
  html, body {
    overflow-x: hidden;
    /* hide horizontal scroll, allow vertical scrolling without bars */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

const PageRoot = styled.div`
  overflow-x: hidden;
  overscroll-behavior: none;
  max-width: 100vw;
`;

const Tournaments = () => {
  return (
    <>
      <Navbar/>
      <Hero/>
    </>

  )
}

export default Tournaments