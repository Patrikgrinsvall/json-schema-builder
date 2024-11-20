export class FormBuilder {
    constructor(config) {
        this.schema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {}
        };
        this.config = config;
        this.loadSchemaFromLocalStorage();
        this.setupUI();
        this.updateFormPreview();
    }

    loadSchemaFromLocalStorage() {
        const storedSchema = localStorage.getItem("formSchema");
        if (storedSchema) {
            this.schema = JSON.parse(storedSchema);
        }
    }

    saveSchemaToLocalStorage() {
        localStorage.setItem("formSchema", JSON.stringify(this.schema));
    }

    updateFormPreview() {
        const formPreview = document.getElementById("formPreview");
        formPreview.innerHTML = "";
        for (const key in this.schema.properties) {
            const field = this.schema.properties[key];
            let inputHtml = this.getInputHtml(field, key);
            formPreview.innerHTML += `<div class="${this.config.default_classes}">${inputHtml}</div>`;
        }
        this.updateJsonPreview();
    }

    getInputHtml(field, key) {
        let inputHtml = `<label class="px-4 py-2 text-white">${key} (${field.type}):</label>`;
        if (field.type === "string" && field.enum) {
            inputHtml += `<select class='px-4 py-2'>`;
            field.enum.forEach((option) => {
                inputHtml += `<option value="${option}">${option}</option>`;
            });
            inputHtml += `</select>`;
        } else if (field.type === "boolean") {
            inputHtml += `<input type="checkbox" class="px-4 py-2" ${field.default ? "checked" : ""
                }>`;
        } else if (field.type === "integer") {
            inputHtml += `<input type="number" class="px-4 py-2" value="${field.default}">`;
        } else {
            inputHtml += `<input type="text" class="px-4 py-2 rounded-lg" value="${field.default}">`;
        }
        inputHtml += `<button onclick="window.formBuilder.removeField('${key}')" class="bg-red-500 hover:bg-red-700 text-white font-bold mx-2 px-4 py-2 rounded">Delete</button>`;
        return inputHtml;
    }

    addField(key, type, defaultValue, enumOptions) {
        if (!key || this.schema.properties[key]) {
            alert("Invalid or duplicate key!");
            return;
        }
        let field = { type: type, default: defaultValue };
        if (type === "string" && enumOptions) {
            field.enum = enumOptions.split(",");
        }
        this.schema.properties[key] = field;
        this.updateFormPreview();
        this.saveSchemaToLocalStorage();
    }

    removeField(key) {
        delete this.schema.properties[key];
        this.updateFormPreview();
        this.saveSchemaToLocalStorage();
    }

    updateJsonPreview() {
        document.getElementById("jsonPreview").textContent = JSON.stringify(
            this.schema,
            null,
            2
        );
    }

    setupUI() {
        const formArea = document.getElementById("addFieldForm");
        formArea.innerHTML = `
              <input type="text" id="key" placeholder="Key or parameter name" class="text-black px-4 py-2 rounded">
              <select id="type" class="px-4 py-2 rounded text-black">
                  <option value="string">String</option>
                  <option value="boolean">Boolean</option>
                  <option value="integer">Integer</option>
              </select>
              <input type="text" id="default" placeholder="Default Value (optional)" class="px-4 rounded py-2 text-black">
              <input type="text" id="enum" placeholder="List of valid inputs (optional, comma-separated)" class="px-4 rounded py-2 text-black">
              <button id="addFieldButton"  class="bg-blue-500 px-4 py-2 rounded shadow hover:bg-blue-700 text-black font-bold  ">Add Field</button>
          `;
        const button = document.getElementById("addFieldButton");
        button.addEventListener('click', () =>
            window.formBuilder.addField(
                document.getElementById('key').value,
                document.getElementById('type').value,
                document.getElementById('default').value,
                document.getElementById('enum').value
            )
        );
    }

    // 1. Generate HTML form without styling
    generateHtmlForm() {
        let html = '<form>';
        for (const key in this.schema.properties) {
            const field = this.schema.properties[key];
            let inputHtml = this.getInputHtmlForExport(field, key);
            html += `<div>${inputHtml}</div>`;
        }
        html += '</form>';
        return html;
    }

    getInputHtmlForExport(field, key) {
        let inputHtml = `<label>${key} (${field.type}):</label>`;
        if (field.type === "string" && field.enum) {
            inputHtml += `<select name="${key}">`;
            field.enum.forEach((option) => {
                inputHtml += `<option value="${option}">${option}</option>`;
            });
            inputHtml += `</select>`;
        } else if (field.type === "boolean") {
            inputHtml += `<input type="checkbox" name="${key}" ${field.default ? "checked" : ""
                }>`;
        } else if (field.type === "integer") {
            inputHtml += `<input type="number" name="${key}" value="${field.default || ''}">`;
        } else {
            inputHtml += `<input type="text" name="${key}" value="${field.default || ''}">`;
        }
        return inputHtml;
    }

    // 2. Generate Python argparse script
    generatePythonCliScript() {
        let script = `import argparse\n\n`;
        script += `def main():\n`;
        script += `    parser = argparse.ArgumentParser()\n`;

        for (const key in this.schema.properties) {
            const field = this.schema.properties[key];
            let arg = `    parser.add_argument('--${key}'`;

            if (field.type === "string") {
                if (field.enum) {
                    arg += `, choices=[${field.enum.map(e => `'${e}'`).join(', ')}]`;
                }
                if (field.default) {
                    arg += `, default='${field.default}'`;
                }
                arg += `, type=str`;
            } else if (field.type === "boolean") {
                arg += `, action='store_true'`;
            } else if (field.type === "integer") {
                if (field.default) {
                    arg += `, default=${field.default}`;
                }
                arg += `, type=int`;
            } else {
                if (field.default) {
                    arg += `, default='${field.default}'`;
                }
                arg += `, type=str`;
            }

            arg += `)\n`;
            script += arg;
        }

        script += `    args = parser.parse_args()\n`;
        script += `    print(args)\n\n`;
        script += `if __name__ == '__main__':\n`;
        script += `    main()\n`;

        return script;
    }

    // 3. Generate Bash script with option parsing
    generateBashScript() {
        let script = `#!/bin/bash\n\n`;
        script += `# Initialize variables\n`;
        for (const key in this.schema.properties) {
            const field = this.schema.properties[key];
            if (field.type === "boolean") {
                script += `${key}=false\n`;
            } else {
                script += `${key}=""\n`;
            }
        }
        script += `\n# Parse options\n`;
        script += `while [[ "$#" -gt 0 ]]; do\n`;
        script += `    case $1 in\n`;
        for (const key in this.schema.properties) {
            const field = this.schema.properties[key];
            if (field.type === "boolean") {
                script += `        --${key}) ${key}=true; shift;;\n`;
            } else {
                script += `        --${key}) ${key}="$2"; shift 2;;\n`;
            }
        }
        script += `        *) echo "Unknown parameter passed: $1"; exit 1;;\n`;
        script += `    esac\n`;
        script += `done\n\n`;
        script += `# Debug output\n`;
        for (const key in this.schema.properties) {
            script += `echo "${key} = \${${key}}"\n`;
        }
        return script;
    }
}
