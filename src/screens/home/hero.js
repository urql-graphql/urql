import React from "react";
import { Link } from "react-static";
import { Wrapper } from "../../components/wrapper";
import styled from "styled-components";
import { ProjectBadge } from "formidable-oss-badges";

const HeroContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  margin-top: 5rem;
  padding: 0;
  position: relative;
  text-align: left;
  width: 100%;
  @media (min-width: 768px) {
    flex-direction: row;
    margin-top: 20rem;
    padding-left: 32rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  letter-spacing: 0.15em;
  margin: 0 0 2rem;
  text-align: center;
  text-transform: uppercase;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 5.8rem;
    margin: 4rem 0 2rem;
    text-align: left;
  }
`;

const HeroBody = styled.p`
  font-family: "Helvetica";
  letter-spacing: 0.08em;
  font-size: 1.4rem;
  line-height: 2.2rem;
  margin: 0 0 6rem;
  max-width: 30rem;
  text-align: left;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 2rem;
    line-height: 2.8rem;
    max-width: 100%;
  }
`;

const HeroLogo = styled(ProjectBadge)`
  max-width: 16rem;
  position: relative;
  @media (min-width: 768px) {
    left: -3rem;
    max-width: auto;
    min-width: 32rem;
    position: absolute;
    top: 0;
  }
`;

const HeroNavList = styled.ul`
  border-top: 0.2rem solid #707070;
  display: flex;
  flex-direction: row;
  justify-content: center;
  list-style: none;
  padding: 2rem 0 0;
  text-align: center;
  width: 100%;
  @media (min-width: 768px) {
    margin: 10rem 0 0;
  }
  & li a {
    color: white;
    display: inline-block;
    font-size: 1.7rem;
    letter-spacing: 0.05em;
    margin: 0 2rem;
    transition: opacity 0.4s;
    text-transform: uppercase;
  }
  & li a:hover {
    color: #8196ff;
  }
`;

class Hero extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      animating: false,
      copied: false
    };
  }

  // Can use for copying option... or delete since it's not being used?
  handleCopy(e) {
    e.preventDefault();
    this.setState({ animating: true, copied: true });
    setTimeout(() => {
      this.setState({ animating: false });
    }, "100");
    setTimeout(() => {
      this.setState({ copied: false });
    }, "3000");
  }

  render() {
    return (
      <Wrapper noPadding>
        <HeroContent>
          <HeroLogo
            description="Urql"
            abbreviation="U"
            color="#8196FF"
            number="03"
          >
            <svg
              width="200px"
              viewBox="0 0 240 170"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              x="13%"
              y="-11%"
            >
              <g
                id="Page-1"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g id="Eagle">
                  <path
                    d="M160.4548,119.7871 C160.4548,121.1181 161.5338,122.1961 162.8638,122.1961 C164.1938,122.1961 165.2728,121.1181 165.2728,119.7871 C165.2728,118.4561 164.1938,117.3781 162.8638,117.3781 L160.4548,117.3781 L160.4548,119.7871 Z"
                    id="Fill-7"
                    fill="#80A7FF"
                  />
                  <path
                    d="M100.089,125.1479 L133.559,158.6179 L133.559,169.4649 L144.758,158.5369 L119.747,133.5239 L119.747,120.0989 L131.261,131.6139 L161.569,131.7009 L180,150.1309 L180,130.5139 C180,123.8659 177.359,117.4899 172.658,112.7889 L120,60.1309 L67.071,7.2019 C62.544,2.6739 56.403,0.1309 50,0.1309 C43.597,0.1309 37.456,2.6739 32.929,7.2019 L0,40.1309 L19.755,40.1309 C25.113,34.7729 33.8,34.7729 39.158,40.1309 L39.392,40.3649 L79.628,80.6009 L59.853,80.6009 L39.392,60.1399 L39.392,69.4209 C39.392,76.0519 42.026,82.4109 46.714,87.0989 L60.059,100.4439 L79.834,120.2179 C79.834,124.3659 81.482,128.3439 84.415,131.2769 L100.054,146.9179 L110.079,156.9419 L110.002,166.2309 L119.451,157.9949 L119.451,168.6479 L130.249,158.3669 L100.089,128.2069"
                    id="Fill-1"
                    fill="#5F8AFF"
                  />
                  <path
                    d="M120.0002,60.1309 L172.9292,7.2019 C177.4562,2.6739 183.5972,0.1309 190.0002,0.1309 C196.4032,0.1309 202.5432,2.6739 207.0712,7.2019 L240.0002,40.1309 L220.2452,40.1309 C214.8872,34.7729 206.2002,34.7729 200.8422,40.1309 L200.6082,40.3649 L150.4212,90.5519"
                    id="Fill-4"
                    fill="#3B7CED"
                  />
                  <path
                    d="M150.4211,90.5518 L120.0001,60.1308 L67.0711,7.2018 C62.5441,2.6748 56.4031,0.1308 50.0001,0.1308 C48.3061,0.1308 46.6321,0.3138 45.0001,0.6598 C49.5381,1.6208 53.7411,3.8718 57.0711,7.2018 L110.0001,60.1308 L140.3911,90.5218 L150.4211,90.5518 Z"
                    id="Fill-17"
                    fill="#80A7FF"
                  />
                  <path
                    d="M57.3991,37.3643 C47.8181,27.7833 32.2851,27.7833 22.7051,37.3643 L21.1101,38.9583 C26.4901,34.8203 34.2291,35.2023 39.1581,40.1313 L39.2501,40.2223 L39.3921,40.2223 L79.6281,80.6003 L100.6471,80.6123 L59.9151,39.8803 L57.3991,37.3643 Z"
                    id="Fill-9"
                    fill="#3B7CED"
                  />
                  <path
                    d="M182.5412,37.3643 C192.1222,27.7833 207.6552,27.7833 217.2352,37.3643 L218.8302,38.9583 C213.4502,34.8203 205.7102,35.2023 200.7822,40.1313 L200.6902,40.2223 L200.5482,40.2223 L150.3912,90.5223 L139.8872,80.0183 L180.0242,39.8803 L182.5412,37.3643 Z"
                    id="Fill-11"
                    fill="#1969DD"
                  />
                  <path
                    d="M70.655,111.0396 L79.834,120.2186 C79.834,124.3666 81.482,128.3446 84.415,131.2776 L100.054,146.9176 L110.079,156.9416 L110.002,166.2316 L119.451,157.9956 L119.451,168.6486 L130.249,158.3666 L100.089,128.2066 L101.567,126.6256 L133.559,158.6186 L133.559,169.4646 L144.759,158.5366 L119.747,133.5246 L119.747,120.0986 C113.946,114.2986 106.079,111.0396 97.876,111.0396 L70.655,111.0396 Z"
                    id="Fill-13"
                    fill="#1969DD"
                  />
                  <path
                    d="M130.2487,158.3667 L100.0887,128.2067 L100.0887,128.2067 L82.9217,111.0397 L70.6547,111.0397 L79.8337,120.2187 C79.8337,124.3667 81.4817,128.3447 84.4147,131.2777 L100.0547,146.9177 L110.0797,156.9417 L110.0017,166.2317 L119.4517,157.9947 L119.4517,168.6487 L130.2487,158.3667 Z"
                    id="Fill-15"
                    fill="#3B7CED"
                  />
                  <path
                    d="M48.8913,89.2759 L91.9723,89.2759 L100.6473,80.6009 L59.8533,80.6009 L39.3923,60.1399 L39.3923,69.4209 C39.3923,76.0519 42.0263,82.4109 46.7143,87.0989 L48.8913,89.2759 Z"
                    id="Fill-20"
                    fill="#80A7FF"
                  />
                </g>
              </g>
            </svg>
          </HeroLogo>
          <HeroTitle>urql</HeroTitle>
          <HeroBody>
            urql is a highly customisable and flexible GraphQL client, that
            happens to come with some default core behaviour and some React
            component and hooks APIs.
          </HeroBody>
        </HeroContent>
        <HeroNavList>
          <li>
            <Link prefetch to="/docs">
              Docs
            </Link>
          </li>
          <li>
            <a
              title="Issues"
              href="https://www.github.com/FormidableLabs/urql/issues"
            >
              Issues
            </a>
          </li>
          <li>
            <a title="GitHub" href="https://github.com/FormidableLabs/urql">
              GitHub
            </a>
          </li>
        </HeroNavList>
      </Wrapper>
    );
  }
}

export default Hero;
