import { NgComponentOutlet } from '@angular/common';
import { Component, Type } from '@angular/core';

import { resumebase64 } from './resumebase64';

@Component({
  selector: 'app-ai',
  imports: [NgComponentOutlet],
  templateUrl: './ai.component.html',
  styleUrl: './ai.component.css',
  standalone: true
})
export class AiComponent {
  conversation: string[] = ["Hello, I am an AI assistant that can help you navigate this web application and better understand Michael as a professional. Please input your query below."];
  project = "";
  thinking = false;
  cubeComponent: Type<unknown>|null = null;
  dataStreamComponent: Type<unknown>|null = null;
  authComponent: Type<unknown>|null = null;
  machineLearningComponent: Type<unknown>|null = null;

  private async ensureComponentsForProject(project: string) {
    const needsCube = project.includes('cube');
    const needsData = project.includes('data');
    const needsAuth = project.includes('auth');
    const needsMl = project.includes('machine-learning');

    if (needsCube && !this.cubeComponent) {
      const { CubeComponent } = await import('../cube/cube.component');
      this.cubeComponent = CubeComponent;
    }
    if (needsData && !this.dataStreamComponent) {
      const { DataStreamComponent } = await import('../data-stream/data-stream.component');
      this.dataStreamComponent = DataStreamComponent;
    }
    if (needsAuth && !this.authComponent) {
      const { AuthComponent } = await import('../auth/auth.component');
      this.authComponent = AuthComponent;
    }
    if (needsMl && !this.machineLearningComponent) {
      const { MachineLearningComponent } = await import('../machine-learning/machine-learning.component');
      this.machineLearningComponent = MachineLearningComponent;
    }
  }

  submitAIQuery(query:string) {
    this.thinking = true;
    this.conversation.push(query)
    fetch("http://localhost:8080/ai", {
    // fetch("https://endpoint-one-2-205823180568.us-central1.run.app/ai", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(
        {
          query: JSON.stringify(
            {
              contents:{
                parts:[
                  {
                    text: query
                  },
                  {
                    text: this.instructions
                  },
                  {
                    inlineData: {
                      mimeType: 'application/pdf',
                      data: resumebase64
                    }
                  }
                ]
              }
            }
          )
        }
      )
    })
      .then(response => response.json())
      .then(data => {
        this.thinking = false;
        const parsed = JSON.parse(data.response) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        };
        parsed.candidates
          ?.flatMap(candidate => candidate.content?.parts ?? [])
          .forEach(part => {
            const text = part.text ?? '';
            const response = text.replaceAll("\n", " ").trim().split(" ");
            this.project = response.pop() ?? '';
            this.conversation.push(response.join(" "));
          });
        void this.ensureComponentsForProject(this.project);
      })
      .catch(err => console.log(err));
  }
  instructions =
    `
      You are an AI assistant.
      Please be respectful and concise.
      
      Your prime objective is to help people 
      navigate the professional web application of Michael Austin Simpson, 
      and better understand him as a professional software engineer.
      
      If the first part of this prompt is not relevant to your prime objective,
      be sure to ignore it,
      be sure to not answer it,
      explain your prime objective,
      encourage the user to ask a question relevant to your prime objective,
      add the keyword other to the end of your response,
      and ignore the remainder of these instructions.

      If the first part of this prompt is relevant to your prime objective,
      consider the information in the attached resume before answering,
      and do not explain your prime objective.
      
      If one of the projects listed below is relevant to the first part of this prompt,
      explain why the project is relevant,
      and add that project's keyword to the end of your response.

      If none of the projects listed below are relevant to the first part of this prompt,
      add the keyword other to the end of your response,
      and do not mention the projects.

      Be sure to add only one keyword to the end of your response.
      
      The first project is the interactive cube project.
      Its keyword is cube.
      It is an interactive 3 dimensional cube that was developed using the threejs library.
      It was made while developing interactive, 3 dimensional maps of data centers at Google that were used for wayfinding and data center layout optimization.
      It demonstrates an ability to develop advanced data visualizations.
      
      The second project is the data stream project.
      Its keyword is data.
      It uses a data stream to search numerous enormous data sets concurrently.
      It is a data engineering project that improves the user experience.
      It is a big data project.

      The third project is the end user authentication project.
      Its keyword is auth.
      It uses the oath2.0 standard to secure a REST endpoint.
      It provides claims to users for granular access control in the connected Java service.
      It depends on Google Cloud and Firebase

      The fourth project is the machine learning project.
      Its keyword is machine-learning.
      It uses tensorflow.
      It trains a model.
      It provides linear regression forecasting.
    `;
}
