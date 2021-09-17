import React, { memo } from "react";
import Drawer from "@material-ui/core/Drawer";

import MenuButton from "./Components/MenuButton/MenuButton";

import { Container } from "./MenuStyle";
import FuncButtons from "./Components/FuncButtons/FuncButtons";
import Parameters from "./Components/Parameters/Parameters";

export default memo(function Menu({
  menuOpen,
  setMenuOpen,
  func,
  setFunc,
  transition,
  parameters,
  setParameters,
}) {
  return (
    <>
      <MenuButton setMenuOpen={setMenuOpen} menuOpen={menuOpen} />
      <Drawer variant="persistent" anchor="right" open={menuOpen}>
        <Container>
          <FuncButtons func={func} setFunc={setFunc} transition={transition} />
          <Parameters parameters={parameters} setParameters={setParameters} />
        </Container>
      </Drawer>
    </>
  );
});