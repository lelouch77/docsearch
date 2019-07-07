/** @jsx h */

import { h, Component } from 'preact';
import Downshift from 'downshift/preact';
import {
  DocSearchHit,
  DocSearchHits,
  QueryParameters,
  Result,
} from 'docsearch-types';

import { AutocompleteResults } from './AutocompleteResults';
import { AutocompleteFooter } from './AutocompleteFooter';

interface AutocompleteProps {
  placeholder: string;
  search(
    searchParameters: QueryParameters
  ): Promise<{ hits: DocSearchHits; result: Result }>;
  onItemSelect?({ hit }: { hit: DocSearchHit }): void;
}

interface AutocompleteState {
  hits: DocSearchHits;
  isDropdownOpen: boolean;
  isLoading: boolean;
  hasErrored: boolean;
}

let docsearchIdCounter = 0;

/**
 * Generates a unique ID for an instance of a DocSearch DownShift instance.
 */
function generateId(): string {
  return String(docsearchIdCounter++);
}

function stateReducer(state: any, changes: any) {
  switch (changes.type) {
    case Downshift.stateChangeTypes.mouseUp:
      return {
        ...changes,
        inputValue: state.inputValue,
      };
    case Downshift.stateChangeTypes.blurInput:
      return {
        ...changes,
        inputValue: state.inputValue,
      };
    default:
      return changes;
  }
}

export class Autocomplete extends Component<
  AutocompleteProps,
  AutocompleteState
> {
  constructor(props: AutocompleteProps) {
    super(props);

    this.state = {
      hits: {},
      isDropdownOpen: false,
      isLoading: false,
      hasErrored: false,
    };
  }

  render() {
    return (
      <Downshift
        id={`docsearch-${generateId()}`}
        itemToString={() => ''}
        defaultHighlightedIndex={0}
        onSelect={(item: DocSearchHit) => {
          this.setState({
            isDropdownOpen: false,
          });

          if (item) {
            this.props.onItemSelect!({ hit: item });
          }
        }}
        onOuterClick={() => {
          this.setState({
            isDropdownOpen: false,
          });
        }}
        scrollIntoView={(itemNode: HTMLElement) => {
          itemNode.scrollIntoView(false);
        }}
        stateReducer={stateReducer}
      >
        {({ getInputProps, getItemProps, getMenuProps, inputValue }) => (
          <div
            className={[
              'algolia-docsearch',
              this.state.isLoading && 'algolia-docsearch--loading',
              this.state.hasErrored && 'algolia-docsearch--errored',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <form
              action=""
              role="search"
              noValidate
              className="algolia-docsearch-form"
            >
              <input
                {...getInputProps({
                  placeholder: this.props.placeholder,
                  type: 'search',
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'off',
                  spellCheck: 'false',
                  maxLength: '512',
                  onChange: (event: any) => {
                    this.setState({
                      isLoading: true,
                      hasErrored: false,
                    });

                    this.props
                      .search({
                        query: event.target.value,
                      })
                      .then(({ hits }) => {
                        this.setState({
                          hits,
                          isLoading: false,
                        });
                      })
                      .catch(error => {
                        this.setState({
                          isLoading: false,
                          hasErrored: true,
                        });

                        throw error;
                      });
                  },
                  onFocus: () => {
                    this.setState({
                      isDropdownOpen: true,
                    });
                  },
                })}
                className="algolia-docsearch-input"
              />
            </form>

            {this.state.isDropdownOpen &&
              Boolean(inputValue) &&
              !this.state.isLoading && (
                <div className="algolia-docsearch-dropdown">
                  <AutocompleteResults
                    hits={this.state.hits}
                    getItemProps={getItemProps}
                    getMenuProps={getMenuProps}
                  />

                  <AutocompleteFooter />
                </div>
              )}
          </div>
        )}
      </Downshift>
    );
  }
}

Autocomplete.defaultProps = {
  placeholder: '',
  onItemSelect: ({ hit }) => {
    if (typeof window !== 'undefined') {
      window.location.assign(hit.url);
    }
  },
};