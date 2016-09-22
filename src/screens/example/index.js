import React from "react";
import { render } from "react-dom";

import Presentation from "./components/example";

export const Example = render(<Presentation/>, document.getElementById("root"));
