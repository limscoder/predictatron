import React, { Component } from "react";
import styled from "styled-components";

const FormBox = styled.div`
  background-color: #f4f4f4;
  border: 4px solid #58F4CD;
  border-radius: 6px;
  padding: 15px;
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
const CheckboxInput = styled.input`
  border: none;
  margin: 8px 6px 0 12px;
  transform: scale(1.5);
`;

export default class Form extends Component {
  render() {
    return (
      <FormBox>
        <form>
          <FieldSet>
            <Label>Prometheus Server:</Label>
            <TextInput
              innerRef={el => this.serverInput = el}
              defaultValue="http://130.211.204.92:9090"
            />
          </FieldSet>
          <Options>
            <OptionSet>
              <div>
                <Label>Metric:</Label>
              </div>
              <div>
                <Select innerRef={el => this.metricInput = el}>
                  <option value="btc_usd">BTC - Bitcoin</option>
                  <option value="eth_uds">ETH - Ether</option>
                </Select>
              </div>
            </OptionSet>
            <OptionSet>
              <div>
                <Label>Prediction:</Label>
              </div>
              <div>
                <Select innerRef={el => this.predictInput = el}>
                  <option value="predict_linear">Linear</option>
                </Select>
              </div>
            </OptionSet>
          </Options>
          <Options>
            <Label>Future Times:</Label>
            <CheckboxInput
              type="checkbox"
              name="5m"
              value="5"
              defaultChecked={true}
            />
            <Label>5m</Label>
            <CheckboxInput
              type="checkbox"
              name="15m"
              value="15"
              defaultChecked={true}
            />
            <Label>15m</Label>
            <CheckboxInput
              type="checkbox"
              name="30m"
              value="30"
              defaultChecked={true}
            />
            <Label>30m</Label>
            <CheckboxInput
              type="checkbox"
              name="60m"
              value="60"
              defaultChecked={true}
            />
            <Label>60m</Label>
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
          <ButtonInput type="button" value="Add Graph" />
        </form>
      </FormBox>
    );
  }

  formData() {
    return {
      promURL: this.serverInput.value,
      predictMetric: this.metricInput.value,
      predictMethod: this.predictInput.value
    };
  }
}
