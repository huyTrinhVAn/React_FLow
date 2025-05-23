import React, { useState, useEffect } from 'react';
import '@cloudscape-design/global-styles/index.css';
import Box from '@cloudscape-design/components/box';
import Select from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { Container, AppLayout, FormField, Button } from '@cloudscape-design/components';
import { OptionDefinition } from "@cloudscape-design/components/internal/components/option/interfaces";



let environment = "nonprod";


// PROD
environment = "prod";


let flowmap = null as any;

function App() {
  const [activeNode, setActiveNode] = useState(null);
  const [sections, setSections] = useState([[]]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const [selectedFlow, setSelectedFlow] = React.useState({ "label": "CC.White Label IVR", "value": "17d0b770-698b-4ee1-a3d1-86b3eb738463" } as OptionDefinition);
  const [flowlist, setFlowList] = React.useState([] as OptionDefinition[]);


  useEffect(() => {
    const fetchData = async () => {
      let list = [] as OptionDefinition[];
      try {
        const json = await fetch("https://gatewayapp.uc." + environment + ".aws.bencloud/", {
          "headers": { "content-type": "application/json" },
          "method": "POST",
          "body": "{\"command\":\"listContactFlows\",\"instanceid\":\"" + instanceid + "\",\"service\":\"connect\",\"flowtype\":[\"CONTACT_FLOW\"]}",
        })

        const data = await json.json();


        for (let u of data.ContactFlowSummaryList) {
          list.push({ "label": u.Name, "value": u.Id })
        }


        list.sort((a, b) => (a.label > b.label) ? 1 : -1)
        setFlowList(list);


      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);



  const getFlow = async () => {

    fetch("https://gatewayapp.uc." + environment + ".aws.bencloud/", {
      "headers": { "content-type": "application/json" },
      "method": "POST",
      "body": "{\"command\":\"describeContactFlow\",\"instanceid\":\"" + instanceid + "\",\"service\":\"connect\",\"flowid\":\"" + selectedFlow.value + "\"}",
    })

      .then(response => { return response.json(); })
      .then(data => {

        const content = JSON.parse(data.ContactFlow.Content);
        console.log(content);
        flowmap = new Map(content.Actions.map((obj: any) => [obj.Identifier, obj]));

        setSections([[]]);
        setActiveNode(flowmap.get(content.StartAction));
        setIsPaused(false);
        console.log(flowmap.get(content.StartAction));

      });
  };


  useEffect(() => {

    if (!isPaused && activeNode) {

      
      setSections((prevSections) => {
        const newSections = [...prevSections];
        const currentSection = [...newSections[newSections.length - 1], activeNode];
        newSections[newSections.length - 1] = currentSection;
        return newSections;
      });
      

      if (activeNode.Transitions.hasOwnProperty('Conditions')) {
        setIsPaused(true);
      } else if (activeNode.Transitions.NextAction) {
        setActiveNode(flowmap.get(activeNode.Transitions.NextAction));
      } else {
        setActiveNode(null);
      }
    }
  }, [activeNode, isPaused]);

  const handleCondition = (condition:OptionDefinition) => {
    setIsPaused(false);
    setSelectedOption(null);
    setSections((prevSections) => [...prevSections, []]);
    if (activeNode)
      setActiveNode(flowmap.get(condition.value));
  };

  return (

    <AppLayout
      navigationOpen={false}

      disableContentPaddings={false}
      navigationHide={true}

      toolsHide={true}
      toolsOpen={false}

      splitPanelOpen={true}

      content={
        <SpaceBetween direction="vertical" size="xxl">

          <FormField
            label="Contact Flow"
            secondaryControl={
              <Button
                onClick={({ }) => getFlow()}
                iconName="play" />}
          >

            <Select
              selectedOption={selectedFlow}
              onChange={({ detail }) =>
                setSelectedFlow(detail.selectedOption)
              }
              options={flowlist}
            />
          </FormField>


          {sections.map((section, sectionIndex) => {
            const lastItem = section[section.length - 1];

            return (
              <Container key={sectionIndex} >
                <SpaceBetween size="s">
                  {section.map((logItem, index) => (
                    <Box key={index} variant="code">
                      {JSON.stringify(logItem)}
                    </Box>
                  ))}
                  {isPaused &&
                    lastItem &&
                    lastItem.Transitions.Conditions &&
                    sectionIndex === sections.length - 1 && (
                      <Select
                        selectedOption={selectedOption}
                        onChange={({ detail }) => {
                          setSelectedOption(detail.selectedOption);
                          handleCondition(detail.selectedOption);
                        }}

                        options={lastItem.Transitions.Conditions.map((condition) => ({
                          label: condition.Condition.Operands,
                          value: condition.NextAction
                        }))}
                        placeholder="Select a condition"
                      />
                    )}
                </SpaceBetween>
              </Container>
            );
          })}
        </SpaceBetween>
      }>
    </ AppLayout>
      );
}

export default App
