import React, { useEffect, useState } from "react";
import PublishIcon from "@material-ui/icons/Publish";
import RefreshIcon from "@material-ui/icons/Refresh";
import {
  SectionSubContainer,
  SectionContainer,
  Row,
  Form,
  StyledIconButton,
} from "../../MenuStyle";
import Param from "./Param/Param";
import { defaultParameters } from "../../../defaultParameters";

export default function Parameters({ parameters, setParameters }) {
  const [localParameters, setLocalParameters] = useState(parameters);

  useEffect(() => {
    setLocalParameters(parameters);
  }, [parameters]);

  const updateValue = (name, value) => {
    setLocalParameters((prev) => {
      return { ...prev, [name]: value };
    });
  };

  const onSubmit = (e) => {
    if (e.code !== "Enter" && e.code !== "NumpadEnter" && e.type !== "click") {
      return;
    }
    const newParameters = { ...localParameters };
    Object.keys(newParameters).forEach((key) => {
      if (key === "name") return;
      newParameters[key] = +newParameters[key];
    });
    setParameters(newParameters);
  };

  const onReset = () => {
    setParameters(defaultParameters[parameters.name]);
  };

  const { name, x, y, z, ...rest } = localParameters;
  return (
    <SectionContainer>
      Parameters
      <Form onKeyDown={onSubmit}>
        <Row>
          <Param name="x" value={localParameters.x} updateValue={updateValue} />
          <Param name="y" value={localParameters.y} updateValue={updateValue} />
          <Param name="z" value={localParameters.z} updateValue={updateValue} />
        </Row>
        <SectionSubContainer>
          {Object.keys(rest).map((key) => (
            <Param
              key={key}
              name={key}
              value={localParameters[key]}
              updateValue={updateValue}
            />
          ))}
        </SectionSubContainer>
        <Row>
          <StyledIconButton
            onClick={onReset}
            disabled={localParameters === defaultParameters[parameters.name]}
          >
            <RefreshIcon />
          </StyledIconButton>
          <StyledIconButton
            onClick={onSubmit}
            disabled={localParameters === parameters}
          >
            <PublishIcon />
          </StyledIconButton>
        </Row>
      </Form>
    </SectionContainer>
  );
}
