import Ecology from "ecology";
import React from "react";

import SpectacleREADME from "!!raw!spectacle/README.markdown";

class Docs extends React.Component {
  render() {
    return (
      <div className="Copy">
        <Ecology overview={SpectacleREADME} />
      </div>
    );
  }
}

export default Docs;
