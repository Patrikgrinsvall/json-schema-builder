import  {FormBuilder } from "./form-builder.js";
 
function onWindowClose() {
    Neutralino.app.exit();
}

Neutralino.init();
let formBuilder = null;
// Register event listeners
Neutralino.events.on("windowClose", onWindowClose);
Neutralino.events.on("ready", function () {
    window.formBuilder = new FormBuilder({
        default_classes: "px-4 py-2 border border-gray-300 text-black rounded-lg"
    });
    document.getElementById("toHtml").addEventListener('click',function(){const html=window.formBuilder.generateHtmlForm();console.log(html)})
    document.getElementById("toPython").addEventListener('click',function(){const html=window.formBuilder.generatePythonCliScript();console.log(html)})
    document.getElementById("toBash").addEventListener('click',function(){const html=window.formBuilder.generateBashScript();console.log(html)})
});