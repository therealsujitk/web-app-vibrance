import React, { createRef } from "react";
import { AppContextInterface } from "../../../contexts/app";
import Network from "../../../utils/network";

export interface BasePanelState {
  /**
   * If `true`, the panel is in a loading state
   * @default true
   */
  isLoading: boolean;
}

export abstract class BasePanel<P = {}, S extends BasePanelState = BasePanelState, SS = any> extends React.Component<P, S, SS> {
  // The api key that will be used in the network requests
  apiKey?: string;
  // The api endpoint for the network requests
  apiEndpoint: string = '';
  // The page number for the network GET requests
  page: number = 1;
  // A boolean that states whether to load items on scroll
  loadOnScroll: boolean = true;
  // A boolean that states whether the PUT and PATCH requests require multipart
  requireMultipart: boolean = false;
  // The form element for the PUT & PATCH requests
  formRef: React.RefObject<HTMLFormElement> = createRef();
  // The error function to handle network errors
  onError?: AppContextInterface['displayError'];

  getEndpoint = () => this.apiEndpoint;
  putEndpoint = () => this.apiEndpoint + '/add';
  patchEndpoint = () => this.apiEndpoint + '/edit';
  deleteEndpoint = () => this.apiEndpoint + '/delete';

  /**
   * This function handles the GET response
   * Use this function to store the response in the state object
   * 
   * @abstract
   * @param response 
   */
  abstract handleGetResponse(response: any) : void;

  /**
   * This function handles the PUT response
   * Use this function to store the response in the state object
   * 
   * @abstract
   * @param response 
   */
  abstract handlePutResponse(response: any) : void;

  /**
   * This function handles the PATCH response
   * Use this function to store the response in the state object
   * 
   * @abstract
   * @param response 
   */
  abstract handlePatchResponse(response: any) : void;

  /**
   * This function handles the DELETE response
   * Use this function to store the response in the state object
   * 
   * @abstract
   * @param response 
   */
  abstract handleDeleteResponse(id: number) : void;

  componentDidMount() {
    this.getItems();

    if (this.loadOnScroll) {
      document.addEventListener('scroll', this.loadMore);
    }
  }

  componentWillUnmount() {
    if (this.loadOnScroll) {
      document.removeEventListener('scroll', this.loadMore);
    }
  }

  loadMore = async (event: Event) => {
    if (this.state.isLoading) {
      return;
    }
    
    const document = event.target as Document;
    const scrollingElement = document.scrollingElement || document.body;

    if (scrollingElement.scrollTop + scrollingElement.clientHeight >= scrollingElement.scrollHeight - 300) {
      await this.getItems();
    }
  }

  getItems = async () => {
    this.setState({ isLoading: true });

    try {
      const response = await new Network(this.apiKey).doGet(this.getEndpoint(), { query: { page: this.page } });
      this.handleGetResponse(response);
      if (response.next_page) this.page = response.next_page;
      return response;
    } catch (err: any) {
      this.onError?.(err, { name: 'Retry', onClick: () => this.getItems() });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  addOrEditItem = async (patchEndpoint = this.patchEndpoint(), putEndpoint = this.putEndpoint()) => {
    try {
      const formData = new FormData(this.formRef.current!);

      // If the form data has an id parameter, then it's an edit request
      if (formData.get('id')) {
        const response = await new Network(this.apiKey).doPatch(patchEndpoint, { body: formData }, this.requireMultipart);
        this.handlePatchResponse(response);
        return response;
      } else {
        const response = await new Network(this.apiKey).doPut(putEndpoint, { body: formData }, this.requireMultipart);
        this.handlePutResponse(response);
        return response;
      }
    } catch (err: any) {
      this.onError?.(err);
      throw err;
    }
  }

  deleteItem = async (id: number, deleteEndpoint = this.deleteEndpoint()) => {
    try {
      const formData = new FormData();
      formData.append('id', id.toString());
      
      await new Network(this.apiKey).doDelete(deleteEndpoint, { body: formData });
      this.handleDeleteResponse(id);
      return id;
    } catch (err: any) {
      this.onError?.(err);
      throw err;
    }
  }
}
