here is some of the prompt issues  :

- There is no proper direction in the prompt. 
- As in one call agent says taht ' The text with the link will come through shortly from essex heating experts' but it has to say something like the link will come after the call. ( you know what we don't have to hardcode these things but we have to write it generic like tell them that team will contact them after the call. )
- The agent didn't give any engaging replaies. 
- Here is one more issues agent says that ' I've go a boiler replacement down here. Hows the boiler at the moment?' , Why it says this, you know what its also hardcode that in the pormpt : ' **Open from what you hold** rather than asking why they rang: "I've got a boiler replacement down
here - is that what you're ringing about?"  why in the prompt you write that , i mean now agent will says this , which is very bad, 
- One more things in the name it always get issues : Agent has to get the full name with first and last name. it has to say can i get you full name , don't write lines like this on agent. Be generic , and agetn has to get there full name , if the user give only his first name , then agent ask the spell fo the first name , and then ask the spell of the last name. now i see a call in whcih agent as what your full name please , and user says Dom , and aget take it as Tom , then as says could you please spell surname for me. now here agent didn't take the spell of first name and he has to take both name , first and last with spell. with any mistakes 
- Also in the address the agent got mistakes.
- There is a lots of things. Like you see there is many things that is complicated the prompt will be easy, generic , understanable by human and AI LLM like GPT. 
- Also we are using the 4.1 mini fast. which is not good we have to chagne it with the best model of llm for voice agent don't use any fast model. I think GPT-4.1 is good. 
- Also one more thing that i notice that all scanarios have very bad prompt , and i mean in easy words these are not understandable , i mean you write a prompt for  new installation in top then mid and then bottom , what is this and why i mean we have to add samething in the same place , 
- The Dom person one of the client isn't happy he says its very very bad talking , 
- The agent should be parent and child like things i mean New insatllation case is the parent and then the prmpt in it will be its child
- Here i paste a pormpt of another voice agent this voice is for different client but its good its prompting is good. your work is to first analyse this one and get to know how we add a beautiful , clean , generic prompt here. the file name is ( prompts/example_voiceagent.md)