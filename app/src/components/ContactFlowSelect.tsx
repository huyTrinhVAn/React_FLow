import React, { useEffect, useState } from "react";
import Select from "@cloudscape-design/components/select";
import type { SelectProps } from "@cloudscape-design/components/select";
import { fetchContactFlows } from "../api/connectService";
import type { ContactFlow } from "../api/connectService";

interface Props {
    env: string;
    instanceId: string;
    onSelect: (flowId: string) => void;
}

const ContactFlowSelect: React.FC<Props> = ({ env, instanceId, onSelect }) => {
    const [options, setOptions] = useState<SelectProps.Option[]>([]);
    const [selected, setSelected] = useState<SelectProps.Option | null>(null);

    useEffect(() => {
        fetchContactFlows(env, instanceId).then((flows: ContactFlow[]) => {
            const opts = flows.map((f) => ({
                label: f.Name,
                value: f.Id,
            }));
            setOptions(opts);
        });
    }, [env, instanceId]);

    const handleChange = ({
        detail,
    }: {
        detail: { selectedOption: SelectProps.Option };
    }) => {
        setSelected(detail.selectedOption);
        if (detail.selectedOption?.value) {
            onSelect(detail.selectedOption.value);
        }
    };

    return (
        <Select
            selectedOption={selected}
            onChange={handleChange}
            options={options}
            filteringType="auto"
            placeholder="Select or search flow"
        />
    );
};

export default ContactFlowSelect;
