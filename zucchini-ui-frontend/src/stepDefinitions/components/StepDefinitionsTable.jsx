import PropTypes from "prop-types";
import React from "react";
import Badge from "react-bootstrap/lib/Badge";
import Table from "react-bootstrap/lib/Table";
import truncate from "lodash/truncate";
import sortBy from "lodash/sortBy";
import StepDefinitionsVariantsDialog from "./StepDefinitionsVariantsDialog";
import StepDefinitionsHighlightedTerm from "./StepDefinitionsHighlightedTerm";

export default class StepDefinitionsTable extends React.Component {
  static propTypes = {
    stepDefinitions: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  render() {
    const { stepDefinitions } = this.props;

    const sortedOccurrences = stepDefinitions.map(definition => {
      const occurrences = sortBy(definition.occurrences, [
        occurrence => occurrence.info.keyword,
        occurrence => occurrence.info.name
      ]);

      return {
        ...definition,
        occurrences
      };
    });
    const sortedDefinitions = sortBy(sortedOccurrences, [
      definition => definition.occurrences[0].info.keyword,
      definition => definition.occurrences[0].info.name
    ]);
    const rows = sortedDefinitions.map((stepDefinition, index) => {
      return <StepDefinitionsRow key={index} stepDefinition={stepDefinition} />;
    });

    return (
      <Table bordered striped hover style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th className="col-md-10">Définition</th>
            <th className="col-md-1" style={{ textAlign: "center" }}>
              Occurrence
            </th>
            <th className="col-md-1" style={{ textAlign: "center" }}>
              Échec
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    );
  }
}

class StepDefinitionsRow extends React.Component {
  static propTypes = {
    stepDefinition: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      showVariants: false
    };
  }

  onShowVariants = () => {
    this.setState({
      showVariants: true
    });
  };

  onHideVariants = () => {
    this.setState({
      showVariants: false
    });
  };

  render() {
    const { stepDefinition } = this.props;
    const stepLocation = `${stepDefinition.stepDefinitionLocation.filename}:${stepDefinition.stepDefinitionLocation.line}`;

    const nbFailures = stepDefinition.occurrences.filter(step => {
      return step.status === "FAILED";
    }).length;
    const failureRate = Math.floor((nbFailures / stepDefinition.occurrences.length) * 100);

    let failureBadge;
    if (failureRate >= 50) {
      failureBadge = "badge-error";
    } else if (failureRate >= 10 && failureRate <= 50) {
      failureBadge = "badge-warning";
    } else if (failureRate < 10) {
      failureBadge = "badge-success";
    }

    return (
      <tr key={stepDefinition}>
        <td style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          <a onClick={this.onShowVariants}>
            <StepDefinitionsCell occurrence={stepDefinition.occurrences[0]} />
          </a>
          <StepDefinitionsVariantsDialog
            occurrences={stepDefinition.occurrences}
            location={stepLocation}
            show={this.state.showVariants}
            onClose={this.onHideVariants}
          />
        </td>
        <td style={{ textAlign: "center" }}>
          <b>{stepDefinition.occurrences.length}</b>
        </td>
        <td style={{ textAlign: "center" }}>
          <Badge bsClass={failureBadge}>{failureRate} %</Badge>
        </td>
      </tr>
    );
  }
}

class StepDefinitionsCell extends React.Component {
  static propTypes = {
    occurrence: PropTypes.object.isRequired
  };

  render() {
    const { occurrence } = this.props;
    const highlightedText = formatStepDefinition(occurrence);
    return (
      <span>
        {highlightedText.map((text, idx) => (
          <span key={idx}>{text}</span>
        ))}
      </span>
    );
  }
}

function formatStepDefinition(stepDefinition) {
  const keyword = stepDefinition.info.keyword;
  const definition = truncate(stepDefinition.info.name, { length: 300 });
  const args = stepDefinition.info.arguments;

  const formattedText = [];
  formattedText.push(
    <span key={definition}>
      <StepDefinitionsHighlightedTerm text={keyword} styleClass="step-definition-keyword" />
      &nbsp;
    </span>
  );

  let startIdx = 0;
  if (args !== undefined) {
    args.forEach((arg, index) => {
      formattedText.push(definition.substr(startIdx, arg.offset - startIdx));
      formattedText.push(
        <StepDefinitionsHighlightedTerm key={index} text={arg.value} styleClass="step-definition-argument" />
      );
      startIdx = arg.offset + arg.value.length;
    });
    formattedText.push(definition.substr(startIdx));
  } else {
    formattedText.push(definition);
  }
  return formattedText;
}
