import React, { Component } from "react";
import styled from "styled-components";
import github from "./github.png";

const FormBox = styled.div`
  background-color: #f4f4f4;
  border: 4px solid #58F4CD;
  border-radius: 6px;
  padding: 15px;
  position: relative;
`;

const FieldSet = styled.div`
  display: flex;
`;
const Label = styled.label`
  font-family: Helvetica;
  font-size: 24px;
`;
const TextInput = styled.input`
  border-radius: 4px;
  border: none;
  flex-grow: 1;
  font-family: Helvetica;
  font-size: 24px;
  margin-left: 15px;
`;
const ButtonInput = styled.input`
  background-color: #58F4CD;
  border: none;
  border-radius: 4px;
  font-family: Helvetica;
  font-size: 24px;
  margin: 16px 8px 0 8px;
  padding: 8px;
`;
const OptionSet = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  margin: 0 28px 8px 0;
`;
const Options = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 16px;
`;
const Select = styled.select`
  background-color: white;
  font-family: Helvetica;
  font-size: 24px;
  margin-left: 8px;
`;
const GitLink = styled.a`
  display: block;
  position: absolute;
  bottom: 5px;
  right: 10px;
`;

export default class Form extends Component {
  render() {
    const { defaults } = this.props;

    return (
      <FormBox>
        <form>
          <FieldSet>
            <Label>Prometheus Server:</Label>
            <TextInput
              innerRef={el => this.serverInput = el}
              defaultValue={defaults.promURL}
            />
          </FieldSet>
          <Options>
            <OptionSet>
              <div>
                <Label>Metric:</Label>
              </div>
              <div>
                <Select
                  innerRef={el => this.metricInput = el}
                  defaultValue={defaults.predictMetric}
                >
                  <option value="btc_usd">
                    BTC - Bitcoin
                  </option>
                  <option value="eth_usd">
                    ETH - Ether
                  </option>
                </Select>
              </div>
            </OptionSet>
            <OptionSet>
              <div>
                <Label>Prediction:</Label>
              </div>
              <div>
                <Select
                  innerRef={el => this.predictInput = el}
                  defaultValue={defaults.predictMethod}
                >
                  <option value="predict_linear">
                    Linear
                  </option>
                </Select>
              </div>
            </OptionSet>
          </Options>
          <Options>
            <OptionSet>
              <div>
                <Label>Past:</Label>
              </div>
              <div>
                <Select
                  innerRef={el => this.pastInput = el}
                  defaultValue={defaults.predictPast}
                >
                  <option value="1800">
                    30m
                  </option>
                  <option value="3600">
                    60m
                  </option>
                  <option value="21600">
                    6h
                  </option>
                  <option value="43200">
                    12h
                  </option>
                  <option value="86400">
                    24h
                  </option>
                  <option value="172800">
                    2d
                  </option>
                  <option value="604800">
                    1w
                  </option>
                </Select>
              </div>
            </OptionSet>
            <OptionSet>
              <div>
                <Label>Future:</Label>
              </div>
              <div>
                <Select
                  innerRef={el => this.futureInput = el}
                  defaultValue={defaults.predictFuture}
                >
                  <option value="5m">
                    5m
                  </option>
                  <option value="15m">
                    15m
                  </option>
                  <option value="30m">
                    30m
                  </option>
                  <option value="60m">
                    60m
                  </option>
                  <option value="360m">
                    6h
                  </option>
                </Select>
              </div>
            </OptionSet>
          </Options>
          <ButtonInput
            type="button"
            value="Execute"
            onClick={e => {
              e.preventDefault();
              if (this.props.onExecute) {
                this.props.onExecute(this.formData());
              }
            }}
          />
          <ButtonInput
            type="button"
            value="Add Graph"
            onClick={e => {
              e.preventDefault();
              if (this.props.onDuplicate) {
                this.props.onDuplicate(this.formData());
              }
            }}
          />
        </form>

        <GitLink href="https://github.com/limscoder/predictatron">
          <img src={github} alt="github" />
        </GitLink>
      </FormBox>
    );
  }

  formData() {
    return {
      promURL: this.serverInput.value,
      predictMetric: this.metricInput.value,
      predictMethod: this.predictInput.value,
      predictPast: this.pastInput.value,
      predictFuture: this.futureInput.value
    };
  }
}
