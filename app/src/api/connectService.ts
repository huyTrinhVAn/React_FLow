export interface ContactFlow {
    Id: string;
    Name: string;
}

export interface FlowDetail {
    Content: any;
}

export async function fetchContactFlows(
    env: string,
    instanceId: string
): Promise<ContactFlow[]> {
    try {
        const response = await fetch(
            `https://gatewayapp.uc.${env}.aws.bencloud/`,
            {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    command: "listContactFlows",
                    instanceid: instanceId,
                    service: "connect",
                    flowtype: ["CONTACT_FLOW"],
                }),
            }
        );

        const result = await response.json();
        return result.ContactFlowSummaryList || [];
    } catch (error) {
        console.error("An error occurred with fetchContactFlows function:", error);
        throw error;
    }
}

export async function describeContactFlow(
    env: string,
    instanceId: string,
    flowId: string
): Promise<FlowDetail> {
    try {
        const response = await fetch(`https://gatewayapp.uc.${env}.aws.bencloud/`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                command: "describeContactFlow",
                flowid: flowId,
                instanceid: instanceId,
                service: "connect",
            }),
        });

        const result = await response.json();

        // ✅ Nếu Content là string → parse
        let parsedContent = result.Content;
        if (typeof parsedContent === "string") {
            try {
                parsedContent = JSON.parse(parsedContent);
            } catch (e) {
                console.error("❌ Failed to parse Content string in API:", e);
                throw new Error("Invalid flow content format.");
            }
        }

        return { Content: parsedContent };
    } catch (error) {
        console.error("An error occurred with describeContactFlow function:", error);
        throw error;
    }
}

