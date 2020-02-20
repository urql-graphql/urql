import React from 'react';
import styled from 'styled-components';

import Features from './features';
import GetStarted from './get-started';
import MoreOSS from './more-oss';
import content from './_content';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';

const Container = styled.div`
  width: 100%;
`;

class Home extends React.Component {
  render() {
    return (
      <Container>
        <Header />
        <Features
          featureArray={content.features}
          components={content.components}
        />
        <GetStarted getStartedObj={content.getStarted} />
        <MoreOSS ossArray={content.oss} />
        <Footer />
      </Container>
    );
  }
}

export default Home;
